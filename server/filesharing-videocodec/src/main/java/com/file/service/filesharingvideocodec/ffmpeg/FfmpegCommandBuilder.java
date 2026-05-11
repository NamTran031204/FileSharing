package com.file.service.filesharingvideocodec.ffmpeg;

import com.file.service.filesharingvideocodec.config.VideoEncodingConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

/**
 * xây dựng dòng lệnh FFmpeg để mã hoá HLS.
 * điều chỉnh các cờ dựa trên việc đầu vào là URL HTTP hay tệp cục bộ.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class FfmpegCommandBuilder {

    private final VideoEncodingConfig encodingConfig;

    /**
     * xây dựng lệnh FFmpeg hoàn chỉnh để mã hoá HLS.
     *
     * @param inputPath   URL presigned (production) hoặc đường dẫn tệp cục bộ (test)
     * @param outputDir   thư mục nơi các tệp .m3u8 và .ts sẽ được ghi
     * @return danh sách các đối số dòng lệnh cho ProcessBuilder
     */
    public List<String> buildCommand(String inputPath, String outputDir) {
        VideoEncodingConfig.FfmpegConfig ffmpeg = encodingConfig.getFfmpeg();
        VideoEncodingConfig.SegmentConfig segment = encodingConfig.getSegment();

        List<String> cmd = new ArrayList<>();
        cmd.add(ffmpeg.getPath());

        // ghi đè đầu ra mà không hỏi
        cmd.add("-y");

        // các cờ kết nối lại — chỉ dành cho các URL HTTP (chế độ production)
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

        // đầu vào
        cmd.add("-i");
        cmd.add(inputPath);

        // video codec
        cmd.add("-c:v");
        cmd.add("libx264");

        // cài đặt trước (preset)
        cmd.add("-preset");
        cmd.add(ffmpeg.getPreset());

        // CRF (hệ số tỷ lệ không đổi)
        cmd.add("-crf");
        cmd.add(String.valueOf(ffmpeg.getCrf()));

        // các luồng (được đặt sau đầu vào = giới hạn bộ mã hoá)
        cmd.add("-threads");
        cmd.add(String.valueOf(ffmpeg.getThreadsPerProcess()));

        // audio codec
        cmd.add("-c:a");
        cmd.add("aac");

        // tốc độ bit âm thanh (audio bitrate)
        cmd.add("-b:a");
        cmd.add(segment.getAudioBitrate());

        // định dạng đầu ra HLS
        cmd.add("-f");
        cmd.add("hls");

        // thời lượng phân đoạn
        cmd.add("-hls_time");
        cmd.add(String.valueOf(segment.getDuration()));

        // loại playlist VOD (thêm #EXT-X-ENDLIST)
        cmd.add("-hls_playlist_type");
        cmd.add("vod");

        // giữ tất cả các phân đoạn trong playlist
        cmd.add("-hls_list_size");
        cmd.add("0");

        // mẫu tên tệp phân đoạn
        cmd.add("-hls_segment_filename");
        cmd.add(outputDir + File.separator + "seg_%04d.ts");

        // playlist đầu ra
        cmd.add(outputDir + File.separator + "index.m3u8");

        log.info("da xay dung lenh FFmpeg: {}", String.join(" ", cmd));
        return cmd;
    }
}
