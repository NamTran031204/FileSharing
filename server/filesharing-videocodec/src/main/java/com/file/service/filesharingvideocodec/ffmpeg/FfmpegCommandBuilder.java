package com.file.service.filesharingvideocodec.ffmpeg;

import com.file.service.filesharingvideocodec.config.VideoEncodingConfig;
import com.file.service.filesharing.core.setting.RuntimeSettings;
import com.file.service.filesharing.core.setting.SettingKey;
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
    private final RuntimeSettings settings;

    static boolean isHttp(String input) {
        return input.startsWith("http://") || input.startsWith("https://");
    }

    /**
     * @param inputPath URL presigned (production) hoac duong dan file cuc bo (test)
     * @param outputDir thu muc ghi index.m3u8 va seg_*.ts
     */
    public List<String> buildCommand(String inputPath, String outputDir) {
        VideoEncodingConfig.FfmpegConfig ffmpeg = encodingConfig.getFfmpeg();
        // moi job goi 1 lan nen cac gia tri video.* la anh chup cua job do
        String threads = String.valueOf(settings.intValue(SettingKey.VIDEO_THREADS_PER_PROCESS));

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
        cmd.addAll(List.of("-c:v", "libx264", "-preset", settings.string(SettingKey.VIDEO_PRESET), "-crf",
                String.valueOf(settings.intValue(SettingKey.VIDEO_CRF)),
                "-threads", threads,
                "-c:a", "aac", "-b:a", settings.string(SettingKey.VIDEO_AUDIO_BITRATE),
                "-f", "hls", "-hls_time", String.valueOf(settings.intValue(SettingKey.VIDEO_SEGMENT_DURATION)),
                "-hls_playlist_type", "vod", "-hls_list_size", "0",
                "-hls_segment_filename", outputDir + File.separator + "seg_%04d.ts",
                outputDir + File.separator + "index.m3u8"));
        return cmd;
    }
}
