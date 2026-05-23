package com.file.service.filesharingvideocodec.ffmpeg;

import com.file.service.filesharingvideocodec.config.VideoEncodingConfig;
import com.file.service.filesharingvideocodec.job.JobService;
import com.file.service.filesharingvideocodec.model.ProcessingJobEntity;
import com.file.service.filesharingvideocodec.storage.MinioUploader;
import com.file.service.filesharingvideocodec.storage.TempFileManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicReference;

/**
 * công cụ thực thi cốt lõi của FFmpeg. quản lý toàn bộ vòng đời:
 * ProcessBuilder → rút cạn stderr → onExit() → tải lên/hoàn tất → dọn dẹp.
 *
 * hỗ trợ hai chế độ được điều khiển bởi video.encoding.is-test:
 * - Production: đọc từ URL presigned của MinIO, tải lên đầu ra lên MinIO
 * - Test: đọc từ tệp cục bộ được mã hoá cứng, ghi vào thư mục cục bộ được mã hoá cứng, không dọn dẹp
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class FfmpegExecutor {

    private static final String TEST_INPUT_PATH =
            "E:\\DaiCuongBK\\Project3\\FileSharing\\server\\filesharing-videocodec\\temp\\activity.mp4";
    private static final String TEST_OUTPUT_BASE =
            "E:\\DaiCuongBK\\Project3\\FileSharing\\server\\filesharing-videocodec\\temp\\dir";

    private final VideoEncodingConfig encodingConfig;
    private final FfmpegCommandBuilder commandBuilder;
    private final StderrDrainer stderrDrainer;
    private final ProgressParser progressParser;
    private final JobService jobService;
    private final MinioUploader minioUploader;
    private final TempFileManager tempFileManager;

    /**
     * thực thi đường ống mã hoá đầy đủ cho một jobId nhất định.
     * phương thức này chạy trên một Virtual Thread được phân phối bởi JobDispatcher.
     */
    public void execute(String jobId) {
        boolean isTest = encodingConfig.isTest();
        String inputPath;
        String outputDir;
        String inputKey = null;

        try {
            // 1. đánh dấu job là PROCESSING
            jobService.markRunning(jobId);

            if (isTest) {
                // chế độ TEST: các đường dẫn được mã hoá cứng
                inputPath = TEST_INPUT_PATH;
                outputDir = TEST_OUTPUT_BASE + File.separator + jobId;
                Files.createDirectories(Path.of(outputDir));
                log.info("[TEST] job {}: dau vao={}, dau ra={}", jobId, inputPath, outputDir);
            } else {
                // chế độ PRODUCTION: lấy đầu vào từ MinIO, đầu ra tới thư mục tạm
                ProcessingJobEntity job = jobService.findById(jobId)
                        .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));
                inputKey = job.getAssetId();
                inputPath = minioUploader.generatePresignedUrl(inputKey, 4);
                outputDir = tempFileManager.createJobDir(jobId);
                log.info("[PROD] job {}: inputKey={}, outputDir={}", jobId, inputKey, outputDir);
            }

            // 2. xây dựng lệnh FFmpeg
            List<String> command = commandBuilder.buildCommand(inputPath, outputDir);

            // 3. bắt đầu tiến trình FFmpeg
            ProcessBuilder processBuilder = new ProcessBuilder(command);
            processBuilder.redirectErrorStream(false);  // giữ riêng stderr để rút cạn
            Process process = processBuilder.start();

            // 4. NGAY LẬP TỨC rút cạn stderr trên Virtual Thread (bắt buộc — ngăn chặn bế tắc đường ống)
            AtomicReference<StderrDrainer.ProgressData> progressRef = new AtomicReference<>();
            Thread drainThread = stderrDrainer.drain(process.getErrorStream(), jobId, progressRef);

            // 5. bắt đầu trình xoá tiến trình định kỳ (mỗi 5 giây)
            Thread progressFlusher = startProgressFlusher(jobId, progressRef);

            // 6. chờ tiến trình với thời gian chờ (không đồng bộ qua onExit)
            long timeoutMinutes = encodingConfig.getFfmpeg().getTimeout() / 60000;
            try {
                Process completedProcess = process.onExit()
                        .orTimeout(timeoutMinutes, TimeUnit.MINUTES)
                        .join();

                int exitCode = completedProcess.exitValue();

                // dừng trình xoá tiến trình
                progressFlusher.interrupt();
                drainThread.join(5000);  // đợi trình rút cạn hoàn thành

                if (exitCode != 0) {
                    throw new RuntimeException("FFmpeg exited with code " + exitCode);
                }

                // 7. xác thực đầu ra
                validateOutput(outputDir, jobId);

                // 8. xử lý sau mã hoá dựa trên chế độ
                if (isTest) {
                    // TEST: đánh dấu là đã hoàn thành với đường dẫn cục bộ, KHÔNG dọn dẹp
                    String playlistPath = outputDir + File.separator + "index.m3u8";
                    jobService.markCompleted(jobId, List.of(playlistPath), playlistPath);
                    log.info("[TEST] job {} hoan tat. dau ra tai: {}", jobId, outputDir);
                } else {
                    // PRODUCTION: tải lên MinIO, sau đó dọn dẹp
                    String playlistUrl = minioUploader.uploadAll(inputKey, outputDir);
                    jobService.markCompleted(jobId, List.of(playlistUrl), playlistUrl);
                    tempFileManager.deleteJobDir(jobId);
                    log.info("[PROD] job {} hoan tat. playlist: {}", jobId, playlistUrl);
                }

            } catch (TimeoutException e) {
                process.destroyForcibly();
                progressFlusher.interrupt();
                throw new RuntimeException("FFmpeg encoding timed out after " + timeoutMinutes + " minutes");
            }

        } catch (Exception e) {
            log.error("job {} that bai: {}", jobId, e.getMessage(), e);
            jobService.markFailed(jobId, e.getMessage());

            // dọn dẹp thư mục tạm khi thất bại (chỉ dành cho production)
            if (!encodingConfig.isTest()) {
                try {
                    tempFileManager.deleteJobDir(jobId);
                } catch (Exception cleanupEx) {
                    log.warn("khong the don dep thu muc tam cho job {}: {}", jobId, cleanupEx.getMessage());
                }
            }
        }
    }

    /**
     * trình xoá tiến trình định kỳ: đọc AtomicReference mỗi 5 giây và ghi vào DB.
     * chạy trên một Virtual Thread. dừng khi bị ngắt.
     */
    private Thread startProgressFlusher(String jobId, AtomicReference<StderrDrainer.ProgressData> progressRef) {
        return Thread.ofVirtual()
                .name("progress-flush-" + jobId)
                .start(() -> {
                    try {
                        while (!Thread.currentThread().isInterrupted()) {
                            Thread.sleep(5000);
                            StderrDrainer.ProgressData data = progressRef.get();
                            if (data != null) {
                                int percent = progressParser.calculatePercent(data.encodedSeconds, 0);
                                String step = String.format("ENCODING (%.1fs, %.1fx)", data.encodedSeconds, data.speed);
                                jobService.updateProgress(jobId, percent, step);
                            }
                        }
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                });
    }

    /**
     * xác thực rằng FFmpeg đã tạo ra các tệp đầu ra dự kiến.
     */
    private void validateOutput(String outputDir, String jobId) {
        File dir = new File(outputDir);
        File m3u8 = new File(dir, "index.m3u8");
        if (!m3u8.exists()) {
            throw new RuntimeException("index.m3u8 not generated for job: " + jobId);
        }

        File[] tsFiles = dir.listFiles((d, name) -> name.endsWith(".ts"));
        if (tsFiles == null || tsFiles.length == 0) {
            throw new RuntimeException("No .ts segments generated for job: " + jobId);
        }

        log.info("dau ra cua job {} da duoc xac thuc: 1 m3u8 + {} phan doan ts", jobId, tsFiles.length);
    }
}
