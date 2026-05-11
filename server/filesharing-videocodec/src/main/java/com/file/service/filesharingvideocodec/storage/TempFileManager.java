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
 * quản lý các thư mục tạm thời cho đầu ra FFmpeg.
 * tạo các thư mục cho từng job và xử lý việc dọn dẹp (bao gồm cả cron dự phòng hàng đêm).
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
     * tạo một thư mục tạm thời riêng cho job.
     * @return đường dẫn tuyệt đối đến thư mục đã tạo
     */
    public String createJobDir(String jobId) throws IOException {
        Path jobDir = Paths.get(baseDir, jobId);
        Files.createDirectories(jobDir);
        log.info("da tao thu muc tam: {}", jobDir);
        return jobDir.toAbsolutePath().toString();
    }

    /**
     * xoá thư mục tạm thời của một job và tất cả nội dung bên trong.
     */
    public void deleteJobDir(String jobId) {
        Path jobDir = Paths.get(baseDir, jobId);
        if (!Files.exists(jobDir)) {
            return;
        }
        try {
            deleteDirectoryRecursive(jobDir);
            log.info("da xoa thu muc tam: {}", jobDir);
        } catch (IOException e) {
            log.warn("khong the xoa thu muc tam {}: {}", jobDir, e.getMessage());
        }
    }

    /**
     * cron dọn dẹp dự phòng: chạy lúc 3 giờ sáng mỗi ngày, xoá các thư mục tạm cũ hơn cleanupAgeHours.
     * xử lý các thư mục mồ côi từ các sự cố JVM khi khối finally không được thực thi.
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void cleanupStaleDirectories() {
        Path basePath = Paths.get(baseDir);
        if (!Files.exists(basePath)) {
            return;
        }

        Instant cutoff = Instant.now().minus(Duration.ofHours(cleanupAgeHours));
        log.info("dang chay don dep thu muc tam cu (gioi han: {})", cutoff);

        try (Stream<Path> dirs = Files.list(basePath)) {
            dirs.filter(Files::isDirectory)
                    .forEach(dir -> {
                        try {
                            Instant lastModified = Files.getLastModifiedTime(dir).toInstant();
                            if (lastModified.isBefore(cutoff)) {
                                deleteDirectoryRecursive(dir);
                                log.info("da don dep thu muc cu: {}", dir);
                            }
                        } catch (IOException e) {
                            log.warn("khong the kiem tra/don dep thu muc {}: {}", dir, e.getMessage());
                        }
                    });
        } catch (IOException e) {
            log.error("khong the liet ke cac thu muc tam de don dep: {}", e.getMessage());
        }
    }

    private void deleteDirectoryRecursive(Path path) throws IOException {
        if (Files.isDirectory(path)) {
            try (Stream<Path> entries = Files.list(path)) {
                entries.forEach(entry -> {
                    try {
                        deleteDirectoryRecursive(entry);
                    } catch (IOException e) {
                        log.warn("khong the xoa: {}", entry, e);
                    }
                });
            }
        }
        Files.deleteIfExists(path);
    }
}
