package com.file.service.filesharingvideocodec.service;

import com.file.service.filesharingvideocodec.config.FfmpegConfig;
import com.file.service.filesharingvideocodec.config.VideoEncodingConfig;
import com.file.service.filesharingvideocodec.exception.EncodingException;
import com.file.service.filesharingvideocodec.model.EncodingProfile;
import com.file.service.filesharingvideocodec.util.EncodingLogger;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.exec.CommandLine;
import org.apache.commons.exec.DefaultExecutor;
import org.apache.commons.exec.PumpStreamHandler;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@Slf4j
@RequiredArgsConstructor
public class VideoEncodingService {

    private final FfmpegConfig ffmpegConfig;
    private final VideoEncodingConfig encodingConfig;
    private final EncodingLogger encodingLogger;

    public File encodeVideoToHLS(String presignedUrl, EncodingProfile profile, String jobId) {
        encodingLogger.logEncodingStart(jobId, presignedUrl, profile.getName());
        
        try {
            File outputDir = createOutputDirectory(jobId, profile);
            
            CommandLine cmdLine = buildFFmpegCommand(presignedUrl, outputDir.getAbsolutePath(), profile);
            
            executeFfmpegCommand(cmdLine, jobId, profile);
            
            validateOutput(outputDir, jobId, profile);
            
            return outputDir;
            
        } catch (Exception e) {
            encodingLogger.logEncodingError(jobId, profile.getName(), e.getMessage());
            throw new EncodingException("Failed to encode video for profile: " + profile.getName(), e);
        }
    }

    private File createOutputDirectory(String jobId, EncodingProfile profile) throws IOException {
        String tempDir = encodingConfig.getTempDir();
        Path outputPath = Paths.get(tempDir, jobId, profile.getSuffix());
        Files.createDirectories(outputPath);
        return outputPath.toFile();
    }

    private CommandLine buildFFmpegCommand(String inputUrl, String outputDir, EncodingProfile profile) {
        String audioBitrate = encodingConfig.getSegment().getAudioBitrate();
        int segmentDuration = encodingConfig.getSegment().getDuration();
        
        return ffmpegConfig.buildFfmpegCommand(
            inputUrl,
            outputDir,
            profile.getResolution(),
            profile.getVideoBitrate(),
            audioBitrate,
            segmentDuration
        );
    }

    private void executeFfmpegCommand(CommandLine cmdLine, String jobId, EncodingProfile profile) throws Exception {
        ByteArrayOutputStream outputStream = ffmpegConfig.createOutputStream();
        ByteArrayOutputStream errorStream = ffmpegConfig.createOutputStream();
        
        PumpStreamHandler streamHandler = ffmpegConfig.createStreamHandler(outputStream, errorStream);
        DefaultExecutor executor = ffmpegConfig.ffmpegExecutor();
        executor.setStreamHandler(streamHandler);
        
        log.info("Executing FFmpeg command for job {}: {}", jobId, cmdLine.toString());
        
        try {
            int exitCode = executor.execute(cmdLine);
            
            if (exitCode != 0) {
                String error = errorStream.toString();
                throw new EncodingException("FFmpeg exited with code " + exitCode + ": " + error);
            }
            
            log.debug("FFmpeg output: {}", outputStream.toString());
            
        } catch (IOException e) {
            String error = errorStream.toString();
            log.error("FFmpeg error output: {}", error);
            throw new EncodingException("FFmpeg execution failed: " + e.getMessage(), e);
        }
    }

    private void validateOutput(File outputDir, String jobId, EncodingProfile profile) {
        File m3u8File = new File(outputDir, "master.m3u8");
        if (!m3u8File.exists()) {
            throw new EncodingException("M3U8 file not generated for job: " + jobId);
        }
        
        File[] tsFiles = outputDir.listFiles((dir, name) -> name.endsWith(".ts"));
        if (tsFiles == null || tsFiles.length == 0) {
            throw new EncodingException("No TS segments generated for job: " + jobId);
        }
        
        encodingLogger.logSegmentComplete(jobId, profile.getName(), tsFiles.length);
    }
}
