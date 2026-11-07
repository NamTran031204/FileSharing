package com.file.service.filesharingvideocodec.ffmpeg;

import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;
import com.file.service.filesharing.core.enums.ProcessingJobType;
import com.file.service.filesharing.core.job.AttemptScope;
import com.file.service.filesharing.core.job.InputMode;
import com.file.service.filesharing.core.job.JobContext;
import com.file.service.filesharing.core.job.JobExecution;
import com.file.service.filesharing.core.job.JobExecutor;
import com.file.service.filesharing.core.job.OutputObject;
import com.file.service.filesharing.core.job.exception.PermanentJobException;
import com.file.service.filesharing.core.job.exception.TransientJobException;
import com.file.service.filesharingvideocodec.config.VideoEncodingConfig;
import io.minio.MinioClient;
import io.minio.StatObjectArgs;
import io.minio.errors.ErrorResponseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Phan rieng cua videocodec: chay ffmpeg doc input qua presigned URL, ghi HLS vao workspace.
 * Output nam duoi prefix attemptId, index.m3u8 upload cuoi cung (runtime lo phan upload).
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class VideoEncodeExecutor implements JobExecutor {

    private final VideoEncodingConfig encodingConfig;
    private final FfmpegCommandBuilder commandBuilder;
    private final StderrDrainer stderrDrainer;
    private final ProgressParser progressParser;
    private final MinioClient minioClient;

    @Value("${minio.buckets.files}")
    private String inputBucket;
    @Value("${minio.buckets.hls}")
    private String hlsBucket;

    @Override
    public Set<ProcessingJobType> supportedTypes() {
        return Set.of(ProcessingJobType.TRANSCODE_HLS);
    }

    @Override
    public InputMode inputMode() {
        return InputMode.STREAM;
    }

    @Override
    public JobExecution process(JobContext ctx) throws PermanentJobException, TransientJobException {
        ProcessingJobEntity job = ctx.job();
        String objectName = job.getObjectName();
        checkInput(objectName);

        Path outDir = ctx.workspace().resolve("hls");
        try {
            Files.createDirectories(outDir);
            List<String> command = commandBuilder.buildCommand(ctx.inputUrl(), outDir.toString(), objectName);
            Process process = new ProcessBuilder(command).redirectErrorStream(false).start();
            ctx.onProcessStarted(process);

            AtomicReference<StderrDrainer.ProgressData> progressRef = new AtomicReference<>();
            Thread drain = stderrDrainer.drain(process.getErrorStream(), job.getJobId(), progressRef);
            Thread flusher = startProgressFlusher(ctx, progressRef);

            long timeoutMinutes = Math.max(1, encodingConfig.getFfmpeg().getTimeout() / 60000);
            try {
                int exit = process.onExit().orTimeout(timeoutMinutes, TimeUnit.MINUTES).join().exitValue();
                drain.join(5000);
                if (exit != 0) {
                    throw new TransientJobException("ffmpeg thoat voi ma " + exit);
                }
            } catch (java.util.concurrent.CompletionException e) {
                process.destroyForcibly();
                if (e.getCause() instanceof TimeoutException) {
                    throw new TransientJobException("ffmpeg qua " + timeoutMinutes + " phut");
                }
                throw new TransientJobException(String.valueOf(e.getCause()), e);
            } finally {
                flusher.interrupt();
            }
            return collectOutputs(outDir, job);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new TransientJobException("bi ngat giua chung");
        } catch (java.io.IOException e) {
            throw new TransientJobException("loi IO khi chay ffmpeg: " + e.getMessage(), e);
        }
    }

    private void checkInput(String objectName) throws PermanentJobException, TransientJobException {
        try {
            long size = minioClient.statObject(StatObjectArgs.builder().bucket(inputBucket).object(objectName).build()).size();
            if (size == 0) throw new PermanentJobException("file video 0 byte");
        } catch (ErrorResponseException e) {
            String code = e.errorResponse().code();
            if ("NoSuchKey".equals(code) || "NoSuchObject".equals(code)) {
                throw new PermanentJobException("khong tim thay file video trong MinIO");
            }
            throw new TransientJobException("MinIO loi khi stat input: " + code, e);
        } catch (PermanentJobException e) {
            throw e;
        } catch (Exception e) {
            throw new TransientJobException("MinIO loi khi stat input: " + e.getMessage(), e);
        }
    }

    private JobExecution collectOutputs(Path outDir, ProcessingJobEntity job) throws TransientJobException {
        File[] ts = outDir.toFile().listFiles((d, n) -> n.endsWith(".ts"));
        File m3u8 = outDir.resolve("index.m3u8").toFile();
        if (!m3u8.exists() || ts == null || ts.length == 0) {
            throw new TransientJobException("ffmpeg khong tao du index.m3u8 va segment");
        }
        String prefix = job.getObjectName() + "/" + job.getAttemptId() + "/";
        List<OutputObject> outs = new ArrayList<>();
        for (File f : ts) {
            outs.add(new OutputObject(hlsBucket, prefix + f.getName(), f.toPath(), "video/mp2t", false));
        }
        String manifestKey = prefix + "index.m3u8";
        outs.add(new OutputObject(hlsBucket, manifestKey, m3u8.toPath(), "application/vnd.apple.mpegurl", true));
        log.info("job={} encode xong: {} segment", job.getJobId(), ts.length);
        return new JobExecution(outs, manifestKey, null, new AttemptScope(hlsBucket, job.getObjectName() + "/"));
    }

    private Thread startProgressFlusher(JobContext ctx, AtomicReference<StderrDrainer.ProgressData> ref) {
        return Thread.ofVirtual().name("progress-flush-" + ctx.job().getJobId()).start(() -> {
            try {
                while (!Thread.currentThread().isInterrupted()) {
                    Thread.sleep(5000);
                    StderrDrainer.ProgressData d = ref.get();
                    if (d != null) {
                        ctx.reportProgress(progressParser.calculatePercent(d.encodedSeconds, 0),
                                String.format("ENCODING (%.1fs, %.1fx)", d.encodedSeconds, d.speed));
                    }
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
    }
}
