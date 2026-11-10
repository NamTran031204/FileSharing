package com.file.service.filesharing.core.job;

import com.file.service.filesharing.core.job.exception.PermanentJobException;
import io.minio.GetObjectArgs;
import io.minio.GetObjectResponse;
import io.minio.MinioClient;
import io.minio.ObjectWriteResponse;
import io.minio.PutObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.errors.ErrorResponseException;
import io.minio.messages.ErrorResponse;
import okhttp3.Headers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class JobStorageTest {
    @TempDir
    Path dir;

    private MinioClient minio;
    private JobStorage storage;

    @BeforeEach
    void setUp() {
        minio = mock(MinioClient.class);
        // retry nhanh cho test, hanh vi giong 1s/2s
        storage = new JobStorage(minio, List.of(Duration.ofMillis(10), Duration.ofMillis(20)));
    }

    private OutputObject out(String key, int bytes) throws IOException {
        Path f = dir.resolve(key);
        Files.write(f, new byte[bytes]);
        return new OutputObject("bkt", key, f, "application/octet-stream", false);
    }

    private static GetObjectResponse body(byte[] b) {
        return new GetObjectResponse(Headers.of(), "bkt", "", "k", new ByteArrayInputStream(b));
    }

    @Test
    void putRetriesThenSucceeds() throws Exception {
        when(minio.putObject(any(PutObjectArgs.class)))
                .thenThrow(new IOException("connection reset"))
                .thenReturn(mock(ObjectWriteResponse.class));
        long bytes = storage.uploadAll(List.of(out("a.ts", 1000)), 15, () -> false, n -> { });
        assertEquals(1000, bytes);
        verify(minio, times(2)).putObject(any(PutObjectArgs.class));
    }

    @Test
    void putFailsAfterThreeAndWaitsBatch() throws Exception {
        AtomicBoolean slowDone = new AtomicBoolean();
        when(minio.putObject(any(PutObjectArgs.class))).thenAnswer(inv -> {
            PutObjectArgs a = inv.getArgument(0);
            if (a.object().equals("bad.ts")) throw new IOException("reset");
            Thread.sleep(300);
            slowDone.set(true);
            return mock(ObjectWriteResponse.class);
        });
        Exception e = assertThrows(Exception.class,
                () -> storage.uploadAll(List.of(out("bad.ts", 10), out("slow.ts", 10)), 15, () -> false, n -> { }));
        assertTrue(e.getMessage().contains("upload"), e.getMessage());
        // loi chi duoc bao sau khi moi upload trong lo da ket thuc
        assertTrue(slowDone.get());
        verify(minio, times(4)).putObject(any(PutObjectArgs.class));
    }

    @Test
    void putStopsRetryWhenLeaseLost() throws Exception {
        when(minio.putObject(any(PutObjectArgs.class))).thenThrow(new IOException("reset"));
        assertThrows(Exception.class, () -> storage.uploadAll(List.of(out("a.ts", 10)), 15, () -> true, n -> { }));
        verify(minio, times(1)).putObject(any(PutObjectArgs.class));
    }

    @Test
    void putDoesNotRetryNonIoError() throws Exception {
        when(minio.putObject(any(PutObjectArgs.class))).thenThrow(new IllegalArgumentException("bad args"));
        assertThrows(Exception.class, () -> storage.uploadAll(List.of(out("a.ts", 10)), 15, () -> false, n -> { }));
        verify(minio, times(1)).putObject(any(PutObjectArgs.class));
    }

    @Test
    void downloadSizeMismatchIsIoError() throws Exception {
        when(minio.getObject(any(GetObjectArgs.class))).thenAnswer(inv -> body(new byte[10]));
        IOException e = assertThrows(IOException.class,
                () -> storage.download("bkt", "k", dir.resolve("in/source.png"), 20, n -> { }, () -> false));
        assertTrue(e.getMessage().contains("10") && e.getMessage().contains("20"), e.getMessage());
        verify(minio, times(3)).getObject(any(GetObjectArgs.class));
    }

    @Test
    void downloadCountsBytesAndReportsEvery8Mb() throws Exception {
        int size = 17 * 1024 * 1024;
        when(minio.getObject(any(GetObjectArgs.class))).thenAnswer(inv -> body(new byte[size]));
        List<Long> seen = Collections.synchronizedList(new ArrayList<>());
        long n = storage.download("bkt", "k", dir.resolve("in/source.png"), size, seen::add, () -> false);
        assertEquals(size, n);
        assertEquals(size, Files.size(dir.resolve("in/source.png")));
        assertTrue(seen.contains(8L * 1024 * 1024) && seen.contains(16L * 1024 * 1024) && seen.contains((long) size), seen.toString());
    }

    @Test
    void statMissingKeyIsPermanent() throws Exception {
        ErrorResponse er = new ErrorResponse("NoSuchKey", "not found", "bkt", "k", "/bkt/k", "rid", "hid");
        when(minio.statObject(any(StatObjectArgs.class))).thenThrow(new ErrorResponseException(er, null, ""));
        assertThrows(PermanentJobException.class, () -> storage.stat("bkt", "k"));
    }

    @Test
    void uploadReportsDoneCount() throws Exception {
        when(minio.putObject(any(PutObjectArgs.class))).thenReturn(mock(ObjectWriteResponse.class));
        AtomicLong last = new AtomicLong();
        OutputObject a = out("a.ts", 5);
        OutputObject m = new OutputObject("bkt", "index.m3u8", out("m", 7).file(), "x", true);
        long bytes = storage.uploadAll(List.of(a, m), 15, () -> false, last::set);
        assertEquals(12, bytes);
        assertEquals(2, last.get());
    }
}
