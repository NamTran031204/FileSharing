package com.file.service.filesharingvideocodec.storage;

import com.file.service.filesharingvideocodec.config.VideoEncodingConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.Instant;
import java.util.stream.Stream;

/**
 * Manages temporary directories for FFmpeg output.
 * Creates per-job directories and handles cleanup (including a nightly fallback cron).
 */
@Component
@Slf4j
public class TempFileManager {

    private final String baseDir;
    private final int cleanupAgeHours;

    public TempFileManager(VideoEncodingConfig config) {
        this.baseDir = config.getTemp().getBaseDir();
        this.cleanupAgeHours = config.getTemp().getCleanupAgeHours();
    }

    /**
     * Create a job-specific temp directory.
     * @return absolute path to the created directory
     */
    public String createJobDir(String jobId) throws IOException {
        Path jobDir = Paths.get(baseDir, jobId);
        Files.createDirectories(jobDir);
        log.info("Created temp directory: {}", jobDir);
        return jobDir.toAbsolutePath().toString();
    }

    /**
     * Delete a job's temp directory and all its contents.
     */
    public void deleteJobDir(String jobId) {
        Path jobDir = Paths.get(baseDir, jobId);
        if (!Files.exists(jobDir)) {
            return;
        }
        try {
            deleteDirectoryRecursive(jobDir);
            log.info("Deleted temp directory: {}", jobDir);
        } catch (IOException e) {
            log.warn("Failed to delete temp directory {}: {}", jobDir, e.getMessage());
        }
    }

    /**
     * Fallback cleanup cron: runs at 3 AM daily, removes temp dirs older than cleanupAgeHours.
     * Catches orphaned directories from JVM crashes where finally blocks didn't execute.
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void cleanupStaleDirectories() {
        Path basePath = Paths.get(baseDir);
        if (!Files.exists(basePath)) {
            return;
        }

        Instant cutoff = Instant.now().minus(Duration.ofHours(cleanupAgeHours));
        log.info("Running stale temp directory cleanup (cutoff: {})", cutoff);

        try (Stream<Path> dirs = Files.list(basePath)) {
            dirs.filter(Files::isDirectory)
                    .forEach(dir -> {
                        try {
                            Instant lastModified = Files.getLastModifiedTime(dir).toInstant();
                            if (lastModified.isBefore(cutoff)) {
                                deleteDirectoryRecursive(dir);
                                log.info("Cleaned up stale directory: {}", dir);
                            }
                        } catch (IOException e) {
                            log.warn("Failed to check/clean directory {}: {}", dir, e.getMessage());
                        }
                    });
        } catch (IOException e) {
            log.error("Failed to list temp directories for cleanup: {}", e.getMessage());
        }
    }

    private void deleteDirectoryRecursive(Path path) throws IOException {
        if (Files.isDirectory(path)) {
            try (Stream<Path> entries = Files.list(path)) {
                entries.forEach(entry -> {
                    try {
                        deleteDirectoryRecursive(entry);
                    } catch (IOException e) {
                        log.warn("Failed to delete: {}", entry, e);
                    }
                });
            }
        }
        Files.deleteIfExists(path);
    }
}
