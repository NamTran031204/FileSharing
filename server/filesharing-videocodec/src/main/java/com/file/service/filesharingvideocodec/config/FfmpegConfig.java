package com.file.service.filesharingvideocodec.config;

import lombok.Data;
import org.apache.commons.exec.CommandLine;
import org.apache.commons.exec.DefaultExecutor;
import org.apache.commons.exec.ExecuteWatchdog;
import org.apache.commons.exec.PumpStreamHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayOutputStream;

@Configuration
@Data
public class FfmpegConfig {

    @Value("${video.encoding.ffmpeg.path:ffmpeg}")
    private String ffmpegPath;

    @Value("${video.encoding.ffmpeg.timeout:3600000}")
    private long ffmpegTimeout;

    @Bean
    public DefaultExecutor ffmpegExecutor() {
        DefaultExecutor executor = new DefaultExecutor();
        executor.setExitValue(0);
        ExecuteWatchdog watchdog = new ExecuteWatchdog(ffmpegTimeout);
        executor.setWatchdog(watchdog);
        return executor;
    }

    public CommandLine buildFfmpegCommand(String inputUrl, String outputDir, 
                                          String resolution, String videoBitrate,
                                          String audioBitrate, int segmentDuration) {
        CommandLine cmdLine = new CommandLine(ffmpegPath);
        
        cmdLine.addArgument("-i");
        cmdLine.addArgument(inputUrl, false);
        
        cmdLine.addArgument("-c:v");
        cmdLine.addArgument("libx264");
        
        cmdLine.addArgument("-b:v");
        cmdLine.addArgument(videoBitrate);
        
        if (resolution != null) {
            cmdLine.addArgument("-s");
            cmdLine.addArgument(resolution);
        }
        
        cmdLine.addArgument("-c:a");
        cmdLine.addArgument("aac");
        
        cmdLine.addArgument("-b:a");
        cmdLine.addArgument(audioBitrate);
        
        cmdLine.addArgument("-f");
        cmdLine.addArgument("hls");
        
        cmdLine.addArgument("-hls_time");
        cmdLine.addArgument(String.valueOf(segmentDuration));
        
        cmdLine.addArgument("-hls_list_size");
        cmdLine.addArgument("0");
        
        cmdLine.addArgument("-hls_segment_filename");
        // Fix: Use backslashes for Windows paths
        String segmentPath = outputDir + "\\segment_%03d.ts";
        cmdLine.addArgument(segmentPath, false);
        
        String m3u8Path = outputDir + "\\master.m3u8";
        cmdLine.addArgument(m3u8Path, false);
        
        return cmdLine;
    }

    public ByteArrayOutputStream createOutputStream() {
        return new ByteArrayOutputStream();
    }

    public PumpStreamHandler createStreamHandler(ByteArrayOutputStream outputStream, 
                                                  ByteArrayOutputStream errorStream) {
        return new PumpStreamHandler(outputStream, errorStream);
    }
}
