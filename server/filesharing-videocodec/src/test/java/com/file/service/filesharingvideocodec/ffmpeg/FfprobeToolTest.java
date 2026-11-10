package com.file.service.filesharingvideocodec.ffmpeg;

import com.file.service.filesharing.core.job.exception.PermanentJobException;
import com.file.service.filesharing.core.job.exception.TransientJobException;
import com.file.service.filesharing.core.job.tool.ToolResult;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class FfprobeToolTest {

    private static ToolResult exit(int code) {
        return new ToolResult("ffprobe", code, false, false, 100, null, List.of("stderr cuoi"));
    }

    private static final String OK_JSON = """
            {"streams":[{"codec_type":"audio"},{"codec_type":"video","width":1920,"height":1080}],
             "format":{"duration":"4.876190","size":"1592838"}}""";

    @Test
    void corruptDataIsPermanent() {
        PermanentJobException e = assertThrows(PermanentJobException.class, () -> FfprobeTool.classify(exit(1),
                "{\"error\":{\"code\":-1094995529,\"string\":\"Invalid data found when processing input\"}}"));
        assertTrue(e.getMessage().contains("ffprobe") && e.getMessage().contains("-1094995529"), e.getMessage());
        assertEquals("stderr cuoi", e.getDetail());
    }

    @Test
    void demuxerAndDecoderNotFoundArePermanent() {
        for (long code : new long[]{-1296385272L, -1128613112L}) {
            assertThrows(PermanentJobException.class, () -> FfprobeTool.classify(exit(1),
                    "{\"error\":{\"code\":" + code + ",\"string\":\"x\"}}"));
        }
    }

    @Test
    void networkErrorIsTransient() {
        TransientJobException e = assertThrows(TransientJobException.class, () -> FfprobeTool.classify(exit(1),
                "{\"error\":{\"code\":-138,\"string\":\"Error number -138 occurred\"}}"));
        assertTrue(e.getMessage().contains("-138"), e.getMessage());
    }

    @Test
    void noVideoStreamIsPermanent() {
        assertThrows(PermanentJobException.class, () -> FfprobeTool.classify(exit(0),
                "{\"streams\":[{\"codec_type\":\"audio\"}],\"format\":{\"duration\":\"3.0\"}}"));
    }

    @Test
    void probeNotFinishedIsTransientEvenWithErrorJson() {
        String corrupt = "{\"error\":{\"code\":-1094995529,\"string\":\"x\"}}";
        assertThrows(TransientJobException.class, () -> FfprobeTool.classify(
                new ToolResult("ffprobe", -1, true, true, 60_000, null, List.of()), corrupt));
        assertThrows(TransientJobException.class, () -> FfprobeTool.classify(
                new ToolResult("ffprobe", 1, false, true, 100, null, List.of()), corrupt));
        assertThrows(TransientJobException.class, () -> FfprobeTool.classify(exit(0), "{khong phai json"));
        assertThrows(TransientJobException.class, () -> FfprobeTool.classify(exit(0), ""));
    }

    @Test
    void okJsonGivesProbe() throws Exception {
        FfprobeTool.Probe p = FfprobeTool.classify(exit(0), OK_JSON);
        assertEquals(4.87619, p.durationSec(), 1e-6);
        assertEquals(1920, p.width());
        assertEquals(1080, p.height());
        assertEquals(1592838L, p.sizeBytes());
    }

    @Test
    void progressMatchesResearchExample() {
        // video 120 s, out_time 60 s, speed 1.50x -> fraction 0.5 (46% trong chang 2..90), ETA 40 s
        List<Double> fractions = new ArrayList<>();
        List<Duration> etas = new ArrayList<>();
        FfmpegProgress p = new FfmpegProgress(120.0, (f, step) -> fractions.add(f), etas::add);
        for (String l : List.of("frame=100", "out_time_us=60000000", "speed=1.50x", "progress=continue")) p.onLine(false, l);
        assertEquals(0.5, fractions.get(fractions.size() - 1), 1e-9);
        assertEquals(Duration.ofSeconds(40), etas.get(etas.size() - 1));
        assertEquals(2 + (int) Math.floor(88 * 0.5), 46);

        p.onLine(true, "[hls @ 0000] Opening 'C:/w/hls/seg_0000.ts' for writing");
        p.onLine(true, "[hls @ 0000] Opening 'C:/w/hls/seg_0001.ts' for writing");
        p.onLine(true, "[AVIOContext @ 0000] Statistics: 1633460 bytes read, 2 seeks");
        assertEquals(2, p.segments());
        assertEquals(1633460L, p.bytesRead());
    }

    @Test
    void progressIgnoresNaValues() {
        List<Double> fractions = new ArrayList<>();
        FfmpegProgress p = new FfmpegProgress(10.0, (f, step) -> fractions.add(f), d -> { });
        for (String l : List.of("out_time_us=N/A", "speed=N/A", "progress=continue")) p.onLine(false, l);
        assertEquals(0.0, fractions.get(0), 1e-9);
    }

    @Test
    void probeCommandHasWhitelistButNoReconnectAtEof() {
        List<String> cmd = FfprobeTool.command("ffprobe", "http://localhost:9000/b/x.mp4?X-Amz-Signature=abc");
        assertTrue(String.join(" ", cmd).contains("-protocol_whitelist http,https,tcp,tls"), cmd.toString());
        assertFalse(cmd.contains("-reconnect_at_eof"), cmd.toString());
        assertEquals("http://localhost:9000/b/x.mp4?X-Amz-Signature=abc", cmd.get(cmd.size() - 1));
    }
}
