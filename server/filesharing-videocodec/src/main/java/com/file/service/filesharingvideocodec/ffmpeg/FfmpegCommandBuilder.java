package com.file.service.filesharingvideocodec.ffmpeg;

import com.file.service.filesharingvideocodec.config.VideoEncodingConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

/**
 * Builds the FFmpeg command line for HLS encoding.
 * Adapts flags based on whether the input is an HTTP URL or local file.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class FfmpegCommandBuilder {

    private final VideoEncodingConfig encodingConfig;

    /**
     * Build the complete FFmpeg command for HLS encoding.
     *
     * @param inputPath   Pre-signed URL (production) or local file path (test)
     * @param outputDir   Directory where .m3u8 and .ts files will be written
     * @return list of command arguments for ProcessBuilder
     */
    public List<String> buildCommand(String inputPath, String outputDir) {
        VideoEncodingConfig.FfmpegConfig ffmpeg = encodingConfig.getFfmpeg();
        VideoEncodingConfig.SegmentConfig segment = encodingConfig.getSegment();

        List<String> cmd = new ArrayList<>();
        cmd.add(ffmpeg.getPath());

        // Overwrite output without asking
        cmd.add("-y");

        // Reconnect flags — only for HTTP URLs (production mode)
        if (inputPath.startsWith("http://") || inputPath.startsWith("https://")) {
            cmd.add("-reconnect");
            cmd.add("1");
            cmd.add("-reconnect_at_eof");
            cmd.add("1");
            cmd.add("-reconnect_streamed");
            cmd.add("1");
            cmd.add("-reconnect_delay_max");
            cmd.add("5");
        }

        // Input
        cmd.add("-i");
        cmd.add(inputPath);

        // Video codec
        cmd.add("-c:v");
        cmd.add("libx264");

        // Preset
        cmd.add("-preset");
        cmd.add(ffmpeg.getPreset());

        // CRF (constant rate factor)
        cmd.add("-crf");
        cmd.add(String.valueOf(ffmpeg.getCrf()));

        // Threads (placed after input = limits encoder)
        cmd.add("-threads");
        cmd.add(String.valueOf(ffmpeg.getThreadsPerProcess()));

        // Audio codec
        cmd.add("-c:a");
        cmd.add("aac");

        // Audio bitrate
        cmd.add("-b:a");
        cmd.add(segment.getAudioBitrate());

        // HLS output format
        cmd.add("-f");
        cmd.add("hls");

        // Segment duration
        cmd.add("-hls_time");
        cmd.add(String.valueOf(segment.getDuration()));

        // VOD playlist type (adds #EXT-X-ENDLIST)
        cmd.add("-hls_playlist_type");
        cmd.add("vod");

        // Keep all segments in playlist
        cmd.add("-hls_list_size");
        cmd.add("0");

        // Segment filename pattern
        cmd.add("-hls_segment_filename");
        cmd.add(outputDir + File.separator + "seg_%04d.ts");

        // Output playlist
        cmd.add(outputDir + File.separator + "index.m3u8");

        log.info("Built FFmpeg command: {}", String.join(" ", cmd));
        return cmd;
    }
}
