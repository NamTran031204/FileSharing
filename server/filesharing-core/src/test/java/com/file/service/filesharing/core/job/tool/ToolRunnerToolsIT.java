package com.file.service.filesharing.core.job.tool;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** Cong cu that chay duoc qua ToolRunner voi moi truong da loc. Thieu bien *_PATH thi fail, khong skip. */
class ToolRunnerToolsIT {

    @ParameterizedTest
    @CsvSource({
            "FFMPEG_PATH, -version, ffmpeg version",
            "FFPROBE_PATH, -version, ffprobe version",
            "VIPS_PATH, --version, vips-",
            "VIPSHEADER_PATH, --version, vips-",
            "EXIFTOOL_PATH, -ver, ."
    })
    void runsWithWhitelistedEnv(String var, String arg, String expect) throws Exception {
        String path = System.getenv(var);
        assertNotNull(path, "thieu bien moi truong " + var);
        List<String> out = Collections.synchronizedList(new ArrayList<>());
        ToolCommand c = new ToolCommand(var, List.of(path, arg), Duration.ofSeconds(30), List.of(), null,
                (stderr, line) -> { if (!stderr) out.add(line); });
        ToolResult r = ToolRunner.run(c, Path.of(System.getProperty("java.io.tmpdir")), p -> { }, "-", "-");
        assertTrue(r.ok(), r.brief() + " " + r.detail());
        assertTrue(out.stream().anyMatch(l -> l.contains(expect)), out.toString());
    }
}
