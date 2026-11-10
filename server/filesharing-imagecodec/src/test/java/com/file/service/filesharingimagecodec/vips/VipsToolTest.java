package com.file.service.filesharingimagecodec.vips;

import com.file.service.filesharing.core.job.exception.PermanentJobException;
import com.file.service.filesharing.core.job.exception.TransientJobException;
import com.file.service.filesharing.core.job.tool.ToolResult;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class VipsToolTest {
    private static final List<String> ALLOWED = List.of("jpegload", "pngload", "webpload", "gifload", "tiffload", "heifload");

    // Output that cua vipsheader -a (W0 muc 2), rut gon
    private static final String ROT6 = """
            E:\\samples\\rot6.jpg: 400x200 uchar, 3 bands, srgb, jpegload
            width: 400
            height: 200
            bands: 3
            filename: E:\\samples\\rot6.jpg
            vips-loader: jpegload
            exif-ifd0-Orientation: 6 (Right-top, Short, 1 components, 2 bytes)
            orientation: 6
            """;

    private static ToolResult exit(int code) {
        return new ToolResult("vipsheader", code, false, false, 50, null, List.of("VipsForeignLoad: not a known file format"));
    }

    @Test
    void parsesHeaderAndSwapsForOrientation() throws Exception {
        VipsTool.Header h = VipsTool.classify(exit(0), ROT6, 50_000_000, ALLOWED);
        assertEquals(new VipsTool.Header(400, 200, "jpegload", 6), h);
        assertArrayEquals(new int[]{200, 400}, VipsTool.displaySize(h));
        assertArrayEquals(new int[]{400, 200}, VipsTool.displaySize(new VipsTool.Header(400, 200, "pngload", 1)));
        assertArrayEquals(new int[]{400, 200}, VipsTool.displaySize(new VipsTool.Header(400, 200, "pngload", 0)));
    }

    @Test
    void unknownFormatIsPermanent() {
        PermanentJobException e = assertThrows(PermanentJobException.class, () -> VipsTool.classify(exit(1), "", 0, ALLOWED));
        assertTrue(e.getMessage().startsWith("vipsheader"), e.getMessage());
        assertTrue(e.getDetail().contains("not a known file format"));
    }

    @Test
    void loaderOutsideAllowlistIsPermanent() {
        String svg = "width: 100\nheight: 50\nvips-loader: svgload\n";
        PermanentJobException e = assertThrows(PermanentJobException.class, () -> VipsTool.classify(exit(0), svg, 0, ALLOWED));
        assertTrue(e.getMessage().contains("svgload"), e.getMessage());
    }

    @Test
    void tooManyPixelsIsPermanent() {
        String huge = "width: 8000\nheight: 8000\nvips-loader: pngload\n";
        PermanentJobException e = assertThrows(PermanentJobException.class,
                () -> VipsTool.classify(exit(0), huge, 50_000_000, ALLOWED));
        assertTrue(e.getMessage().contains("64000000"), e.getMessage());
        assertDoesNotThrow(() -> VipsTool.classify(exit(0), huge, 0, ALLOWED));
    }

    @Test
    void probeNotFinishedIsTransient() {
        assertThrows(TransientJobException.class, () -> VipsTool.classify(
                new ToolResult("vipsheader", -1, true, true, 30_000, null, List.of()), ROT6, 0, ALLOWED));
        assertThrows(TransientJobException.class, () -> VipsTool.classify(
                new ToolResult("vipsheader", 1, false, true, 100, null, List.of()), "", 0, ALLOWED));
        // exit 0 nhung output khong co width/height/loader
        assertThrows(TransientJobException.class, () -> VipsTool.classify(exit(0), "rac", 0, ALLOWED));
    }

    @Test
    void progressMapsIntoRange() {
        List<Double> f = new ArrayList<>();
        var p = VipsTool.progressParser(0.0, 0.9, "PREVIEW", (x, step) -> f.add(x));
        p.onLine(false, "vips.exe temp-25: 2560 x 1707 pixels, 2 threads, 2560 x 16 tiles, 384 lines in buffer");
        p.onLine(false, "vips.exe temp-25: 50% complete");
        p.onLine(false, "vips.exe temp-25: 100% complete");
        p.onLine(true, "loi gi do 70% complete");
        assertEquals(List.of(0.45, 0.9), f);
    }
}
