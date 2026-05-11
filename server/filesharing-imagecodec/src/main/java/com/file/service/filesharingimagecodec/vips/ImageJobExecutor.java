package com.file.service.filesharingimagecodec.vips;

import com.file.service.filesharingimagecodec.config.ImageProcessingConfig;
import com.file.service.filesharingimagecodec.job.JobService;
import com.file.service.filesharingimagecodec.model.ProcessingJobEntity;
import com.file.service.filesharingimagecodec.storage.MinioStorageClient;
import com.file.service.filesharingimagecodec.storage.TempFileManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * trình thực thi xử lý ảnh cốt lõi. quản lý toàn bộ vòng đời:
 * tải xuống → VipsProcessor → tải lên → dọn dẹp.
 *
 * hỗ trợ hai chế độ được điều khiển bởi image.processing.is-test:
 * - Production: tải xuống từ MinIO, tải kết quả lên MinIO
 * - Test: sử dụng ảnh cục bộ được mã hoá cứng, bỏ qua tải xuống/tải lên MinIO
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ImageJobExecutor {

    private static final String TEST_INPUT_PATH =
            "E:\\DaiCuongBK\\Project3\\FileSharing\\server\\filesharing-imagecodec\\temp\\test-image.png";
    private static final String TEST_OUTPUT_BASE =
            "E:\\DaiCuongBK\\Project3\\FileSharing\\server\\filesharing-imagecodec\\temp\\output";

    private final ImageProcessingConfig config;
    private final VipsProcessor vipsProcessor;
    private final JobService jobService;
    private final MinioStorageClient storageClient;
    private final TempFileManager tempFileManager;

    /**
     * execute toàn bộ quy trình  cho một jobId.
     * method chạy trên một Virtual Thread do JobDispatcher phân phối.
     */
    public void execute(String jobId) {
        boolean isTest = config.isTest();
        int timeoutSeconds = config.getVips().getProcessingTimeoutSeconds();

        try {
            CompletableFuture
                    .supplyAsync(() -> {
                        try {
                            return doProcess(jobId, isTest);
                        } catch (Exception e) {
                            throw new RuntimeException(e);
                        }
                    }, runnable -> Thread.ofVirtual().start(runnable))
                    .orTimeout(timeoutSeconds, TimeUnit.SECONDS)
                    .join();

        } catch (Exception ex) {
            Throwable cause = unwrapCause(ex);

            if (cause instanceof TimeoutException) {
                log.error("job {} da het thoi gian cho sau {}s", jobId, timeoutSeconds);
                jobService.markFailed(jobId, "Processing timed out after " + timeoutSeconds + "s");
            } else if (isCorruptInput(cause)) {
                log.error("job {} that bai — dau vao bi hong: {}", jobId, cause.getMessage());
                jobService.markFailedPermanently(jobId, cause.getMessage());
            } else {
                log.error("job {} that bai: {}", jobId, cause.getMessage(), cause);
                jobService.markFailed(jobId, cause.getMessage());
            }

            // dọn dẹp tệp tạm thời khi thất bại (chỉ dành cho production)
            if (!isTest) {
                try { tempFileManager.deleteJobDir(jobId); } catch (Exception ignored) {}
            }
        }
    }

    private List<VipsResult> doProcess(String jobId, boolean isTest) throws Exception {
        // 1. đánh dấu job là PROCESSING
        jobService.markRunning(jobId);

        // 2. lấy chi tiết job cho các tuỳ chọn xử lý
        ProcessingJobEntity job = jobService.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        int thumbnailWidth = 200;  // mặc định
        int quality = config.getOutput().getWebpQuality();

        // trích xuất từ cấu hình job nếu có
        if (job.getConfig() != null) {
            if (job.getConfig().getMaxThumbnails() != null && job.getConfig().getMaxThumbnails() > 0) {
                thumbnailWidth = job.getConfig().getMaxThumbnails();
            }
        }

        VipsOptions options = VipsOptions.builder()
                .thumbnailWidth(thumbnailWidth)
                .quality(quality)
                .stripMetadata(config.getOutput().isStripMetadata())
                .build();

        List<VipsResult> results;

        if (isTest) {
            log.info("[test] job {}: xu ly tu {}", jobId, TEST_INPUT_PATH);
            jobService.updateProgress(jobId, 10, "DOWNLOADING (test-local)");
            results = vipsProcessor.processFromFile(TEST_INPUT_PATH, options);
            jobService.updateProgress(jobId, 80, "PROCESSED");

            String outputDir = TEST_OUTPUT_BASE + "/" + jobId;
            java.nio.file.Files.createDirectories(Path.of(outputDir));
            List<String> outputKeys = new ArrayList<>();
            for (VipsResult r : results) {
                Path outPath = Path.of(outputDir, r.getFileName());
                java.nio.file.Files.write(outPath, r.getData());
                outputKeys.add(outPath.toString());
            }

            jobService.markCompleted(jobId, outputKeys, outputDir);
            log.info("[test] job {} hoan tat. dau ra tai: {}", jobId, outputDir);

        } else {
            String inputKey = job.getAssetId();
            log.info("[prod] job {}: inputKey={}", jobId, inputKey);
            jobService.updateProgress(jobId, 5, "DOWNLOADING");

            boolean isLarge = storageClient.isLargeImage(inputKey);

            if (isLarge) {
                // ảnh lớn: tải xuống tệp tạm thời
                String ext = extractExtension(inputKey);
                Path tempPath = Path.of(tempFileManager.createJobDir(jobId), "input." + ext);
                storageClient.downloadToFile(inputKey, tempPath);
                jobService.updateProgress(jobId, 20, "PROCESSING (from file)");
                results = vipsProcessor.processFromFile(tempPath.toString(), options);
            } else {
                // ảnh nhỏ: tải xuống byte[]
                byte[] inputBytes = storageClient.downloadToBytes(inputKey);
                jobService.updateProgress(jobId, 20, "PROCESSING (from memory)");
                results = vipsProcessor.processFromBytes(inputBytes, options);
            }

            jobService.updateProgress(jobId, 80, "UPLOADING");

            // tải lên kết quả song song
            String outputPrefix = "processed/" + jobId;
            List<MinioStorageClient.UploadItem> uploadItems = results.stream()
                    .map(r -> new MinioStorageClient.UploadItem(r.getFileName(), r.getData(), r.getContentType()))
                    .toList();
            storageClient.uploadAllParallel(outputPrefix, uploadItems);

            List<String> outputKeys = results.stream()
                    .map(r -> outputPrefix + "/" + r.getFileName())
                    .toList();

            jobService.markCompleted(jobId, outputKeys, outputPrefix + "/thumb.webp");
            log.info("[prod] job {} hoan tat. tien to dau ra: {}", jobId, outputPrefix);

            // dọn dẹp temp dir
            tempFileManager.deleteJobDir(jobId);
        }

        return results;
    }

    private boolean isCorruptInput(Throwable e) {
        if (e == null) return false;
        String msg = e.getMessage();
        if (msg == null) return false;
        msg = msg.toLowerCase();
        return msg.contains("unable to load")
                || msg.contains("no known loader")
                || msg.contains("invalid image")
                || msg.contains("unsupported format");
    }

    private Throwable unwrapCause(Throwable ex) {
        Throwable cause = ex;
        while (cause.getCause() != null && cause.getCause() != cause) {
            cause = cause.getCause();
        }
        return cause;
    }

    private String extractExtension(String key) {
        int dot = key.lastIndexOf('.');
        return dot >= 0 ? key.substring(dot + 1) : "jpg";
    }
}
