package com.file.service.filesharingvideocodec.service;

import com.file.service.filesharingvideocodec.config.VideoEncodingConfig;
import com.file.service.filesharingvideocodec.dto.EncodingResult;
import com.file.service.filesharingvideocodec.dto.ProfileResult;
import com.file.service.filesharingvideocodec.exception.EncodingException;
import com.file.service.filesharingvideocodec.model.EncodingProfile;
import com.file.service.filesharingvideocodec.util.EncodingLogger;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Stream;

@Service
@Slf4j
@RequiredArgsConstructor
public class EncodingOrchestrationService {

    private final VideoEncodingService videoEncodingService;
    private final VideoUploadService videoUploadService;
    private final VideoEncodingConfig encodingConfig;
    private final EncodingLogger encodingLogger;

    public EncodingResult processVideoEncoding(String presignedUrl) {
        String jobId = UUID.randomUUID().toString();
        long startTime = System.currentTimeMillis();
        
        Map<EncodingProfile, ProfileResult> profileResults = new HashMap<>();
        List<EncodingProfile> profiles = parseProfiles();
        
        int maxAttempts = encodingConfig.getRetry().getMaxAttempts();
        long retryDelayMs = encodingConfig.getRetry().getDelayMs();
        
        try {
            for (EncodingProfile profile : profiles) {
                ProfileResult profileResult = processProfileWithRetry(
                    presignedUrl, profile, jobId, maxAttempts, retryDelayMs
                );
                profileResults.put(profile, profileResult);
            }
            
            cleanupTempDirectory(jobId);
            
            long totalDuration = System.currentTimeMillis() - startTime;
            encodingLogger.logJobComplete(jobId, totalDuration, profileResults.size());
            
            return EncodingResult.builder()
                .jobId(jobId)
                .presignedUrl(presignedUrl)
                .profiles(profileResults)
                .status("SUCCESS")
                .timestamp(LocalDateTime.now())
                .totalDurationMs(totalDuration)
                .build();
                
        } catch (Exception e) {
            log.error("Encoding job {} failed after all retries", jobId, e);
            
            return EncodingResult.builder()
                .jobId(jobId)
                .presignedUrl(presignedUrl)
                .profiles(profileResults)
                .status("FAILED")
                .errorMessage(e.getMessage())
                .timestamp(LocalDateTime.now())
                .totalDurationMs(System.currentTimeMillis() - startTime)
                .build();
        }
    }

    private ProfileResult processProfileWithRetry(String presignedUrl, EncodingProfile profile, 
                                                   String jobId, int maxAttempts, long retryDelayMs) {
        long startTime = System.currentTimeMillis();
        
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                if (attempt > 1) {
                    encodingLogger.logRetryAttempt(jobId, attempt, maxAttempts);
                    Thread.sleep(retryDelayMs);
                }
                
                File outputDir = videoEncodingService.encodeVideoToHLS(presignedUrl, profile, jobId);
                
                List<String> uploadedUrls = videoUploadService.uploadEncodedSegments(jobId, outputDir, profile);
                
                String m3u8Url = uploadedUrls.stream()
                    .filter(url -> url.endsWith(".m3u8"))
                    .findFirst()
                    .orElse(null);
                
                List<String> tsUrls = uploadedUrls.stream()
                    .filter(url -> url.endsWith(".ts"))
                    .toList();
                
                long duration = System.currentTimeMillis() - startTime;
                encodingLogger.logProfileComplete(jobId, profile.getName(), duration, m3u8Url);
                
                return ProfileResult.builder()
                    .profile(profile)
                    .m3u8Url(m3u8Url)
                    .tsFileUrls(tsUrls)
                    .durationMs(duration)
                    .status("SUCCESS")
                    .build();
                    
            } catch (Exception e) {
                if (attempt == maxAttempts) {
                    encodingLogger.logEncodingError(jobId, profile.getName(), 
                        "Failed after " + maxAttempts + " attempts: " + e.getMessage());
                    
                    return ProfileResult.builder()
                        .profile(profile)
                        .status("FAILED")
                        .error(e.getMessage())
                        .durationMs(System.currentTimeMillis() - startTime)
                        .build();
                }
            }
        }
        
        throw new EncodingException("Should not reach here");
    }

    private List<EncodingProfile> parseProfiles() {
        List<String> configProfiles = encodingConfig.getProfiles();
        List<EncodingProfile> profiles = new ArrayList<>();
        
        for (String profileStr : configProfiles) {
            try {
                EncodingProfile profile = EncodingProfile.valueOf(profileStr);
                profiles.add(profile);
            } catch (IllegalArgumentException e) {
                log.warn("Unknown encoding profile: {}", profileStr);
            }
        }
        
        return profiles;
    }

    private void cleanupTempDirectory(String jobId) {
        try {
            String tempDir = encodingConfig.getTempDir();
            Path jobDir = Paths.get(tempDir, jobId);
            
            if (Files.exists(jobDir)) {
                deleteDirectory(jobDir);
                log.info("Cleaned up temp directory for job: {}", jobId);
            }
        } catch (IOException e) {
            log.warn("Failed to cleanup temp directory for job {}: {}", jobId, e.getMessage());
        }
    }

    private void deleteDirectory(Path path) throws IOException {
        if (Files.isDirectory(path)) {
            try (Stream<Path> entries = Files.list(path)) {
                entries.forEach(entry -> {
                    try {
                        deleteDirectory(entry);
                    } catch (IOException e) {
                        log.warn("Failed to delete: {}", entry, e);
                    }
                });
            }
        }
        Files.deleteIfExists(path);
    }
}
