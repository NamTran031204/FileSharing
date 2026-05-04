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
 * Core FFmpeg execution engine. Manages the full lifecycle:
 * ProcessBuilder → stderr drain → onExit() → upload/complete → cleanup.
 *
 * Supports two modes controlled by video.encoding.is-test:
 * - Production: reads from MinIO presigned URL, uploads output to MinIO
 * - Test: reads from hardcoded local file, writes to hardcoded local dir, no cleanup
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
     * Execute the full encoding pipeline for a given jobId.
     * This method runs on a Virtual Thread dispatched by JobDispatcher.
     */
    public void execute(String jobId) {
        boolean isTest = encodingConfig.isTest();
        String inputPath;
        String outputDir;

        try {
            // 1. Mark job as PROCESSING
            jobService.markRunning(jobId);

            if (isTest) {
                // TEST MODE: hardcoded paths
                inputPath = TEST_INPUT_PATH;
                outputDir = TEST_OUTPUT_BASE + File.separator + jobId;
                Files.createDirectories(Path.of(outputDir));
                log.info("[TEST] Job {}: input={}, output={}", jobId, inputPath, outputDir);
            } else {
                // PRODUCTION MODE: get input from MinIO, output to temp dir
                ProcessingJobEntity job = jobService.findById(jobId)
                        .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));
                String inputKey = job.getAssetId();
                inputPath = minioUploader.generatePresignedUrl(inputKey, 4);
                outputDir = tempFileManager.createJobDir(jobId);
                log.info("[PROD] Job {}: inputKey={}, outputDir={}", jobId, inputKey, outputDir);
            }

            // 2. Build FFmpeg command
            List<String> command = commandBuilder.buildCommand(inputPath, outputDir);

            // 3. Start FFmpeg process
            ProcessBuilder processBuilder = new ProcessBuilder(command);
            processBuilder.redirectErrorStream(false);  // Keep stderr separate for draining
            Process process = processBuilder.start();

            // 4. IMMEDIATELY drain stderr on Virtual Thread (mandatory — prevents pipe deadlock)
            AtomicReference<StderrDrainer.ProgressData> progressRef = new AtomicReference<>();
            Thread drainThread = stderrDrainer.drain(process.getErrorStream(), jobId, progressRef);

            // 5. Start periodic progress flusher (every 5 seconds)
            Thread progressFlusher = startProgressFlusher(jobId, progressRef);

            // 6. Wait for process with timeout (async via onExit)
            long timeoutMinutes = encodingConfig.getFfmpeg().getTimeout() / 60000;
            try {
                Process completedProcess = process.onExit()
                        .orTimeout(timeoutMinutes, TimeUnit.MINUTES)
                        .join();

                int exitCode = completedProcess.exitValue();

                // Stop progress flusher
                progressFlusher.interrupt();
                drainThread.join(5000);  // Wait for drain to finish

                if (exitCode != 0) {
                    throw new RuntimeException("FFmpeg exited with code " + exitCode);
                }

                // 7. Validate output
                validateOutput(outputDir, jobId);

                // 8. Handle post-encode based on mode
                if (isTest) {
                    // TEST: mark completed with local path, do NOT cleanup
                    String playlistPath = outputDir + File.separator + "index.m3u8";
                    jobService.markCompleted(jobId, List.of(playlistPath), playlistPath);
                    log.info("[TEST] Job {} completed. Output at: {}", jobId, outputDir);
                } else {
                    // PRODUCTION: upload to MinIO, then cleanup
                    String playlistUrl = minioUploader.uploadAll(jobId, outputDir);
                    jobService.markCompleted(jobId, List.of(playlistUrl), playlistUrl);
                    tempFileManager.deleteJobDir(jobId);
                    log.info("[PROD] Job {} completed. Playlist: {}", jobId, playlistUrl);
                }

            } catch (TimeoutException e) {
                process.destroyForcibly();
                progressFlusher.interrupt();
                throw new RuntimeException("FFmpeg encoding timed out after " + timeoutMinutes + " minutes");
            }

        } catch (Exception e) {
            log.error("Job {} failed: {}", jobId, e.getMessage(), e);
            jobService.markFailed(jobId, e.getMessage());

            // Cleanup temp dir on failure (production only)
            if (!encodingConfig.isTest()) {
                try {
                    tempFileManager.deleteJobDir(jobId);
                } catch (Exception cleanupEx) {
                    log.warn("Failed to cleanup temp dir for job {}: {}", jobId, cleanupEx.getMessage());
                }
            }
        }
    }

    /**
     * Periodic progress flusher: reads AtomicReference every 5 seconds and writes to DB.
     * Runs on a Virtual Thread. Stops when interrupted.
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
     * Validate that FFmpeg produced the expected output files.
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

        log.info("Job {} output validated: 1 m3u8 + {} ts segments", jobId, tsFiles.length);
    }
}
