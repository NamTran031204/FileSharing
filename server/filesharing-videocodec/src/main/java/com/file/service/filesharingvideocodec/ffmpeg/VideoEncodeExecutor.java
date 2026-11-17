package com.file.service.filesharingvideocodec.ffmpeg;

import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;
import com.file.service.filesharing.core.enums.ProcessingJobType;
import com.file.service.filesharing.core.job.AttemptScope;
import com.file.service.filesharing.core.job.InputMode;
import com.file.service.filesharing.core.job.JobContext;
import com.file.service.filesharing.core.setting.RuntimeSettings;
import com.file.service.filesharing.core.setting.SettingKey;
import com.file.service.filesharing.core.job.JobExecution;
import com.file.service.filesharing.core.job.JobExecutor;
import com.file.service.filesharing.core.job.OutputObject;
import com.file.service.filesharing.core.job.exception.PermanentJobException;
import com.file.service.filesharing.core.job.exception.TransientJobException;
import com.file.service.filesharing.core.job.tool.ToolCommand;
import com.file.service.filesharing.core.job.tool.ToolResult;
import com.file.service.filesharing.core.job.tool.ToolRunner;
import com.file.service.filesharingvideocodec.config.VideoEncodingConfig;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Phan rieng cua videocodec: PROBE bang ffprobe (phan loai permanent truoc khi encode), roi ffmpeg doc input qua
 * presigned URL, ghi HLS vao workspace. Moi tien trinh chay qua ctx.exec. Output nam duoi prefix attemptId,
 * index.m3u8 upload cuoi cung (runtime lo phan upload).
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class VideoEncodeExecutor implements JobExecutor {

    private final VideoEncodingConfig encodingConfig;
    private final FfmpegCommandBuilder commandBuilder;
    private final RuntimeSettings settings;

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

    // Sai duong dan cong cu thi worker khong khoi dong, tranh day hang loat job vao DEAD_LETTER
    @PostConstruct
    void verifyTools() {
        verify("ffmpeg", encodingConfig.getFfmpeg().getPath());
        verify("ffprobe", encodingConfig.getFfmpeg().getFfprobePath());
    }

    private static void verify(String tool, String path) {
        if (path == null || path.isBlank()) throw new IllegalStateException(tool + ": chua cau hinh duong dan");
        try {
            ToolResult r = ToolRunner.run(ToolCommand.of(tool, List.of(path, "-version"), Duration.ofSeconds(30)),
                    null, p -> { }, "-", "-");
            if (!r.ok()) throw new IllegalStateException(tool + " khong chay duoc: " + path + " (" + r.brief() + ")");
        } catch (IOException e) {
            throw new IllegalStateException(tool + " khong chay duoc: " + path + " (" + e.getMessage() + ")", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(tool + " bi ngat khi kiem: " + path, e);
        }
    }

    @Override
    public JobExecution process(JobContext ctx) throws PermanentJobException, TransientJobException {
        ProcessingJobEntity job = ctx.job();
        VideoEncodingConfig.FfmpegConfig cfg = encodingConfig.getFfmpeg();
        String url = ctx.inputUrl();
        // chup timeout o dau job, khong doi giua chung
        Duration probeTimeout = settings.duration(SettingKey.VIDEO_PROBE_TIMEOUT);
        Duration encodeTimeout = settings.duration(SettingKey.VIDEO_TIMEOUT);

        FfprobeTool.Probe probe;
        try (JobContext.Stage st = ctx.stage("probe", 0, 2)) {
            probe = FfprobeTool.run(ctx, cfg.getFfprobePath(), url, probeTimeout);
        }
        ctx.metrics().mediaSeconds(probe.durationSec());

        Path outDir = ctx.workspace().resolve("hls");
        try {
            Files.createDirectories(outDir);
        } catch (IOException e) {
            throw new TransientJobException("khong tao duoc thu muc output: " + e.getMessage(), e);
        }
        FfmpegProgress progress = new FfmpegProgress(probe.durationSec(), ctx::progress, ctx::eta);
        ToolResult r;
        try (JobContext.Stage st = ctx.stage("process", 2, 90)) {
            r = ctx.exec(new ToolCommand("ffmpeg", commandBuilder.buildCommand(url, outDir.toString()),
                    encodeTimeout, List.of(url), Map.of(), progress));
        }
        if (progress.bytesRead() != null) ctx.metrics().bytesIn(progress.bytesRead());
        // Exit code ffmpeg khong on dinh (S4, W0 muc 7): sau PROBE thanh cong, moi loi encode la transient
        if (!r.ok()) throw new TransientJobException(r.brief(), r.detail());
        return collectOutputs(outDir, job);
    }

    private JobExecution collectOutputs(Path outDir, ProcessingJobEntity job) throws TransientJobException {
        File[] ts = outDir.toFile().listFiles((d, n) -> n.endsWith(".ts"));
        File m3u8 = outDir.resolve("index.m3u8").toFile();
        if (!m3u8.exists() || m3u8.length() == 0 || ts == null || ts.length == 0) {
            throw new TransientJobException("ffmpeg khong tao du index.m3u8 va segment");
        }
        for (File f : ts) {
            if (f.length() == 0) throw new TransientJobException("ffmpeg tao segment 0 byte: " + f.getName());
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
}
