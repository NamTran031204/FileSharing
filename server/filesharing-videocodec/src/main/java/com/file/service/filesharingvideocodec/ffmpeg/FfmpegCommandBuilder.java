package com.file.service.filesharingvideocodec.ffmpeg;

import com.file.service.filesharingvideocodec.config.VideoEncodingConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

/**
 * Dung dong lenh FFmpeg ma hoa HLS. Khong log: ToolRunner log dong lenh da che presigned URL.
 */
@Component
@RequiredArgsConstructor
public class FfmpegCommandBuilder {
    // Ket noi lai khi doc presigned URL; dung chung cho ffprobe
    static final List<String> RECONNECT = List.of("-reconnect", "1", "-reconnect_at_eof", "1",
            "-reconnect_streamed", "1", "-reconnect_delay_max", "5");

    private final VideoEncodingConfig encodingConfig;

    static boolean isHttp(String input) {
        return input.startsWith("http://") || input.startsWith("https://");
    }

    /**
     * @param inputPath URL presigned (production) hoac duong dan file cuc bo (test)
     * @param outputDir thu muc ghi index.m3u8 va seg_*.ts
     */
    public List<String> buildCommand(String inputPath, String outputDir) {
        VideoEncodingConfig.FfmpegConfig ffmpeg = encodingConfig.getFfmpeg();
        VideoEncodingConfig.SegmentConfig segment = encodingConfig.getSegment();
        String threads = String.valueOf(ffmpeg.getThreadsPerProcess());

        List<String> cmd = new ArrayList<>(List.of(ffmpeg.getPath(), "-hide_banner", "-y",
                // tien do dang key=value tren stdout moi 5s; -v verbose de co "Statistics: N bytes read"
                "-nostats", "-progress", "pipe:1", "-stats_period", "5", "-v", "verbose"));
        if (isHttp(inputPath)) {
            cmd.add("-protocol_whitelist");
            cmd.add(FfprobeTool.PROTOCOLS);
            cmd.addAll(RECONNECT);
        }
        // -threads truoc -i: gioi han decoder; sau -i: gioi han encoder
        cmd.addAll(List.of("-threads", threads, "-i", inputPath));
        cmd.addAll(List.of("-c:v", "libx264", "-preset", ffmpeg.getPreset(), "-crf", String.valueOf(ffmpeg.getCrf()),
                "-threads", threads,
                "-c:a", "aac", "-b:a", segment.getAudioBitrate(),
                "-f", "hls", "-hls_time", String.valueOf(segment.getDuration()),
                "-hls_playlist_type", "vod", "-hls_list_size", "0",
                "-hls_segment_filename", outputDir + File.separator + "seg_%04d.ts",
                outputDir + File.separator + "index.m3u8"));
        return cmd;
    }
}
