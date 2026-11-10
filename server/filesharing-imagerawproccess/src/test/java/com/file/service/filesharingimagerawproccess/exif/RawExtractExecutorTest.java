package com.file.service.filesharingimagerawproccess.exif;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.file.service.filesharing.core.job.exception.PermanentJobException;
import com.file.service.filesharing.core.job.exception.TransientJobException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RawExtractExecutorTest {
    @TempDir
    Path dir;

    @Test
    void exifWithErrorOrWithoutEmbeddedImageIsPermanent() {
        assertThrows(PermanentJobException.class,
                () -> RawExtractExecutor.classifyExif("[{\"SourceFile\":\"x\",\"Error\":\"File format error\"}]"));
        assertThrows(PermanentJobException.class,
                () -> RawExtractExecutor.classifyExif("[{\"SourceFile\":\"x\",\"Make\":\"Canon\"}]"));
    }

    @Test
    void exifUnreadableIsTransient() {
        assertThrows(TransientJobException.class, () -> RawExtractExecutor.classifyExif(""));
        assertThrows(TransientJobException.class, () -> RawExtractExecutor.classifyExif("{khong phai json"));
    }

    @Test
    void exifWithEmbeddedImageOk() throws Exception {
        JsonNode n = RawExtractExecutor.classifyExif("[{\"Orientation\":6,\"PreviewImage\":\"(Binary data 2356417 bytes)\"}]");
        assertEquals(6, n.path("Orientation").asInt());
    }

    private Path jpeg(String name, int size, boolean valid) throws Exception {
        byte[] b = new byte[size];
        if (valid) {
            b[0] = (byte) 0xFF; b[1] = (byte) 0xD8; b[2] = (byte) 0xFF;
            b[size - 2] = (byte) 0xFF; b[size - 1] = (byte) 0xD9;
        }
        Path p = dir.resolve(name);
        Files.write(p, b);
        return p;
    }

    @Test
    void pickLargestAndSmallestValidJpegByPixelsThenBytes() throws Exception {
        Path big = jpeg("IFD0_PreviewImage.jpg", 5000, true);
        Path small = jpeg("IFD1_ThumbnailImage.jpg", 1000, true);
        Path bad = jpeg("IFD2_Other.jpg", 9000, false);
        assertTrue(RawExtractExecutor.isJpeg(big));
        assertFalse(RawExtractExecutor.isJpeg(bad));
        RawExtractExecutor.Pick p = RawExtractExecutor.pickEmbedded(List.of(
                new RawExtractExecutor.Candidate(small, 1000, 160, 120),
                new RawExtractExecutor.Candidate(big, 5000, 5472, 3648)));
        assertEquals(big, p.preview().path());
        assertEquals(small, p.thumb().path());
        // bang pixel thi so byte
        RawExtractExecutor.Pick q = RawExtractExecutor.pickEmbedded(List.of(
                new RawExtractExecutor.Candidate(small, 1000, 160, 120),
                new RawExtractExecutor.Candidate(big, 5000, 160, 120)));
        assertEquals(big, q.preview().path());
        assertEquals(small, q.thumb().path());
    }

    @Test
    void singleCandidateUsedForBothAndNoneIsTransient() throws Exception {
        Path only = jpeg("IFD1_ThumbnailImage.jpg", 1000, true);
        RawExtractExecutor.Pick p = RawExtractExecutor.pickEmbedded(List.of(new RawExtractExecutor.Candidate(only, 1000, 160, 120)));
        assertEquals(only, p.preview().path());
        assertEquals(only, p.thumb().path());
        assertThrows(TransientJobException.class, () -> RawExtractExecutor.pickEmbedded(List.of()));
    }

    @Test
    void displaySizeSwapsFor5To8() {
        assertArrayEquals(new int[]{3648, 5472}, RawExtractExecutor.displaySize(5472, 3648, 6));
        assertArrayEquals(new int[]{3648, 5472}, RawExtractExecutor.displaySize(5472, 3648, 8));
        assertArrayEquals(new int[]{5472, 3648}, RawExtractExecutor.displaySize(5472, 3648, 1));
        assertArrayEquals(new int[]{5472, 3648}, RawExtractExecutor.displaySize(5472, 3648, 3));
    }

    @Test
    void sanitizedExifHasNoWorkspacePath() throws Exception {
        String ws = "C:\\Temp\\raw-input\\6aef";
        JsonNode exif = new ObjectMapper().readTree("""
                [{"SourceFile":"C:/Temp/raw-input/6aef/input/source.cr2","Directory":"C:/Temp/raw-input/6aef/input",
                  "FileName":"source.cr2","Make":"Canon","Note":"C:\\\\Temp\\\\raw-input\\\\6aef\\\\x","Orientation":1}]""").get(0);
        String out = RawExtractExecutor.sanitizeExif(exif, ws);
        for (String leak : List.of("SourceFile", "raw-input", "source.cr2", "Directory")) {
            assertFalse(out.contains(leak), leak + " trong: " + out);
        }
        assertTrue(out.contains("Canon") && out.contains("Orientation"), out);
    }
}
