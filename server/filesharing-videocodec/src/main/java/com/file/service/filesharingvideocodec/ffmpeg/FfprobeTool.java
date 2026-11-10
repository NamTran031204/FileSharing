package com.file.service.filesharingvideocodec.ffmpeg;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.file.service.filesharing.core.job.JobContext;
import com.file.service.filesharing.core.job.exception.PermanentJobException;
import com.file.service.filesharing.core.job.exception.TransientJobException;
import com.file.service.filesharing.core.job.tool.ToolCommand;
import com.file.service.filesharing.core.job.tool.ToolResult;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * PROBE video bang ffprobe JSON. Phan loai theo spec (quy tac 2-4):
 * khong chay xong / output hong -> transient; error.code thuoc tap du lieu hong -> permanent; code khac -> transient;
 * khong co stream video -> permanent. Khong anh xa exit code, khong so chuoi stderr.
 */
public final class FfprobeTool {
    // AVERROR_INVALIDDATA, AVERROR_DEMUXER_NOT_FOUND, AVERROR_DECODER_NOT_FOUND
    static final Set<Long> CORRUPT_CODES = Set.of(-1094995529L, -1296385272L, -1128613112L);
    // Chi mo protocol can cho presigned URL; playlist tro toi file:/udp:/data: khong duoc mo
    static final String PROTOCOLS = "http,https,tcp,tls";
    // Khong dung -reconnect_at_eof: probe doc toi EOF roi ket noi lai, file hong ra I/O error (-5) thay vi INVALIDDATA
    static final List<String> PROBE_RECONNECT = List.of("-reconnect", "1", "-reconnect_streamed", "1",
            "-reconnect_delay_max", "5");
    private static final int MAX_JSON = 1024 * 1024;
    private static final ObjectMapper JSON = new ObjectMapper();

    public record Probe(double durationSec, Integer width, Integer height, Long sizeBytes) {
    }

    private FfprobeTool() {
    }

    static List<String> command(String ffprobePath, String input) {
        List<String> cmd = new ArrayList<>(List.of(ffprobePath, "-v", "quiet", "-show_error", "-show_format",
                "-show_streams", "-of", "json"));
        if (FfmpegCommandBuilder.isHttp(input)) {
            cmd.add("-protocol_whitelist");
            cmd.add(PROTOCOLS);
            cmd.addAll(PROBE_RECONNECT);
        }
        cmd.add(input);
        return cmd;
    }

    public static Probe run(JobContext ctx, String ffprobePath, String input, Duration timeout)
            throws PermanentJobException, TransientJobException {
        StringBuilder out = new StringBuilder();
        ToolCommand c = new ToolCommand("ffprobe", command(ffprobePath, input), timeout, List.of(input), Map.of(),
                (stderr, line) -> {
                    if (!stderr && out.length() < MAX_JSON) out.append(line).append('\n');
                });
        ToolResult r = ctx.exec(c);
        return classify(r, out.toString());
    }

    static Probe classify(ToolResult r, String json) throws PermanentJobException, TransientJobException {
        // Quy tac 2: PROBE khong chay xong thi khong tin output
        if (r.timedOut() || r.killed()) throw new TransientJobException(r.brief(), r.detail());
        JsonNode root;
        try {
            root = json == null || json.isBlank() ? null : JSON.readTree(json);
        } catch (Exception e) {
            root = null;
        }
        if (root == null || !root.isObject()) {
            throw new TransientJobException("ffprobe: output khong doc duoc (" + r.brief() + ")", r.detail());
        }
        JsonNode err = root.get("error");
        if (err != null) {
            long code = err.path("code").asLong();
            String msg = "ffprobe: " + err.path("string").asText("loi") + " (code " + code + ")";
            if (CORRUPT_CODES.contains(code)) throw new PermanentJobException(msg, r.detail());
            throw new TransientJobException(msg, r.detail());
        }
        if (!r.ok()) throw new TransientJobException(r.brief(), r.detail());
        JsonNode video = null;
        for (JsonNode s : root.path("streams")) {
            if ("video".equals(s.path("codec_type").asText())) {
                video = s;
                break;
            }
        }
        if (video == null) throw new PermanentJobException("ffprobe: khong co stream video", r.detail());
        JsonNode fmt = root.path("format");
        double duration = fmt.path("duration").asDouble(0);
        Long size = fmt.hasNonNull("size") ? fmt.path("size").asLong() : null;
        Integer w = video.hasNonNull("width") ? video.path("width").asInt() : null;
        Integer h = video.hasNonNull("height") ? video.path("height").asInt() : null;
        return new Probe(duration, w, h, size);
    }
}
