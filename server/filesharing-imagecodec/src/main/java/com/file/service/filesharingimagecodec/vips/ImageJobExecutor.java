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
 * Core image processing executor. Manages the full lifecycle:
 * Download → VipsProcessor → Upload → Cleanup.
 *
 * Supports two modes controlled by image.processing.is-test:
 * - Production: downloads from MinIO, uploads results to MinIO
 * - Test: uses hardcoded local image, skips MinIO download/upload
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ImageJobExecutor {

    private static final String TEST_INPUT_PATH =
            "E:\\DaiCuongBK\\Project3\\FileSharing\\server\\filesharing-imagecodec\\temp\\test-image.jpg";
    private static final String TEST_OUTPUT_BASE =
            "E:\\DaiCuongBK\\Project3\\FileSharing\\server\\filesharing-imagecodec\\temp\\output";

    private final ImageProcessingConfig config;
    private final VipsProcessor vipsProcessor;
    private final JobService jobService;
    private final MinioStorageClient storageClient;
    private final TempFileManager tempFileManager;

    /**
     * Execute the full image processing pipeline for a given jobId.
     * This method runs on a Virtual Thread dispatched by JobDispatcher.
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
                log.error("Job {} timed out after {}s", jobId, timeoutSeconds);
                jobService.markFailed(jobId, "Processing timed out after " + timeoutSeconds + "s");
            } else if (isCorruptInput(cause)) {
                log.error("Job {} failed — corrupt input: {}", jobId, cause.getMessage());
                jobService.markFailedPermanently(jobId, cause.getMessage());
            } else {
                log.error("Job {} failed: {}", jobId, cause.getMessage(), cause);
                jobService.markFailed(jobId, cause.getMessage());
            }

            // Cleanup temp file on failure (production only)
            if (!isTest) {
                try { tempFileManager.deleteJobDir(jobId); } catch (Exception ignored) {}
            }
        }
    }

    private List<VipsResult> doProcess(String jobId, boolean isTest) throws Exception {
        // 1. Mark job as PROCESSING
        jobService.markRunning(jobId);

        // 2. Get job details for processing options
        ProcessingJobEntity job = jobService.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        int thumbnailWidth = 200;  // Default
        int quality = config.getOutput().getWebpQuality();

        // Extract from job config if available
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
            // TEST MODE: process from hardcoded local file
            log.info("[TEST] Job {}: processing from {}", jobId, TEST_INPUT_PATH);
            jobService.updateProgress(jobId, 10, "DOWNLOADING (test-local)");
            results = vipsProcessor.processFromFile(TEST_INPUT_PATH, options);
            jobService.updateProgress(jobId, 80, "PROCESSED");

            // Save output locally instead of uploading
            String outputDir = TEST_OUTPUT_BASE + "/" + jobId;
            java.nio.file.Files.createDirectories(Path.of(outputDir));
            List<String> outputKeys = new ArrayList<>();
            for (VipsResult r : results) {
                Path outPath = Path.of(outputDir, r.getFileName());
                java.nio.file.Files.write(outPath, r.getData());
                outputKeys.add(outPath.toString());
            }

            jobService.markCompleted(jobId, outputKeys, outputDir);
            log.info("[TEST] Job {} completed. Output at: {}", jobId, outputDir);

        } else {
            // PRODUCTION MODE: download from MinIO, process, upload
            String inputKey = job.getAssetId();
            log.info("[PROD] Job {}: inputKey={}", jobId, inputKey);
            jobService.updateProgress(jobId, 5, "DOWNLOADING");

            boolean isLarge = storageClient.isLargeImage(inputKey);

            if (isLarge) {
                // Large image: download to temp file
                String ext = extractExtension(inputKey);
                Path tempPath = Path.of(tempFileManager.createJobDir(jobId), "input." + ext);
                storageClient.downloadToFile(inputKey, tempPath);
                jobService.updateProgress(jobId, 20, "PROCESSING (from file)");
                results = vipsProcessor.processFromFile(tempPath.toString(), options);
            } else {
                // Small image: download to byte[]
                byte[] inputBytes = storageClient.downloadToBytes(inputKey);
                jobService.updateProgress(jobId, 20, "PROCESSING (from memory)");
                results = vipsProcessor.processFromBytes(inputBytes, options);
            }

            jobService.updateProgress(jobId, 80, "UPLOADING");

            // Upload results in parallel
            String outputPrefix = "processed/" + jobId;
            List<MinioStorageClient.UploadItem> uploadItems = results.stream()
                    .map(r -> new MinioStorageClient.UploadItem(r.getFileName(), r.getData(), r.getContentType()))
                    .toList();
            storageClient.uploadAllParallel(outputPrefix, uploadItems);

            List<String> outputKeys = results.stream()
                    .map(r -> outputPrefix + "/" + r.getFileName())
                    .toList();

            jobService.markCompleted(jobId, outputKeys, outputPrefix + "/thumb.webp");
            log.info("[PROD] Job {} completed. Output prefix: {}", jobId, outputPrefix);

            // Cleanup temp dir if used
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
