package com.file.service.filesharing.core.job;

import com.file.service.filesharing.core.job.exception.PermanentJobException;
import io.minio.GetObjectArgs;
import io.minio.GetObjectResponse;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.ListObjectsArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectsArgs;
import io.minio.Result;
import io.minio.StatObjectArgs;
import io.minio.errors.ErrorResponseException;
import io.minio.errors.ServerException;
import io.minio.http.Method;
import io.minio.messages.DeleteError;
import io.minio.messages.DeleteObject;
import io.minio.messages.Item;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.BooleanSupplier;
import java.util.function.IntConsumer;
import java.util.function.LongConsumer;
import java.util.regex.Pattern;

@Slf4j
public class JobStorage {
    private static final Pattern ATTEMPT_DIR = Pattern.compile("[0-9a-f]{24}/?");
    private static final List<Duration> DEFAULT_RETRY = List.of(Duration.ofSeconds(1), Duration.ofSeconds(2));
    private static final int BUFFER = 64 * 1024;
    private static final long REPORT_EVERY = 8L * 1024 * 1024;

    private final MinioClient minio;
    // Cho giua cac lan thu lai I/O trong cung lan thu job: 3 lan = lan dau + 2 lan cho
    private final List<Duration> retryDelays;

    public JobStorage(MinioClient minio) {
        this(minio, DEFAULT_RETRY);
    }

    JobStorage(MinioClient minio, List<Duration> retryDelays) {
        this.minio = minio;
        this.retryDelays = retryDelays;
    }

    public String presignGet(String bucket, String key, Duration ttl) throws Exception {
        return minio.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                .method(Method.GET).bucket(bucket).object(key)
                .expiry((int) ttl.toSeconds(), TimeUnit.SECONDS).build());
    }

    // Kich thuoc object input. Khong ton tai -> permanent (quy tac 1)
    public long stat(String bucket, String key) throws Exception {
        try {
            return minio.statObject(StatObjectArgs.builder().bucket(bucket).object(key).build()).size();
        } catch (ErrorResponseException e) {
            String code = e.errorResponse() == null ? null : e.errorResponse().code();
            if ("NoSuchKey".equals(code) || "NoSuchObject".equals(code)) {
                throw new PermanentJobException("khong tim thay file input trong MinIO");
            }
            throw e;
        }
    }

    /**
     * Tai object ve target, dem byte, goi onBytes moi 8 MB va khi xong. So byte khac expectedSize la loi I/O.
     * Loi I/O/5xx thu lai trong cung lan thu (1s, 2s); mat lease thi thoi.
     */
    public long download(String bucket, String key, Path target, long expectedSize,
                         LongConsumer onBytes, BooleanSupplier lost) throws Exception {
        Files.createDirectories(target.getParent());
        return withRetry("tai input", lost, () -> {
            long n = 0;
            long nextReport = REPORT_EVERY;
            try (GetObjectResponse in = minio.getObject(GetObjectArgs.builder().bucket(bucket).object(key).build());
                 OutputStream out = Files.newOutputStream(target)) {
                byte[] buf = new byte[BUFFER];
                int r;
                while ((r = in.read(buf)) != -1) {
                    out.write(buf, 0, r);
                    n += r;
                    if (n >= nextReport) {
                        onBytes.accept(n);
                        nextReport += REPORT_EVERY;
                    }
                }
            }
            if (n != expectedSize) throw new IOException("tai thieu input: " + n + "/" + expectedSize + " byte");
            onBytes.accept(n);
            return n;
        });
    }

    /**
     * Object uploadLast=false len song song theo lo, xong het moi toi object uploadLast=true.
     * Moi object thu lai rieng khi loi I/O/5xx. Mot object hong thi van cho ca lo ket thuc roi moi bao loi.
     * Tra ve tong byte da upload; onDone nhan so object da xong.
     */
    public long uploadAll(List<OutputObject> outputs, int batchSize, BooleanSupplier lost, IntConsumer onDone) throws Exception {
        List<OutputObject> first = outputs.stream().filter(o -> !o.uploadLast()).toList();
        List<OutputObject> last = outputs.stream().filter(OutputObject::uploadLast).toList();
        AtomicLong bytes = new AtomicLong();
        AtomicInteger done = new AtomicInteger();
        for (int i = 0; i < first.size(); i += batchSize) {
            List<OutputObject> batch = first.subList(i, Math.min(i + batchSize, first.size()));
            List<CompletableFuture<Void>> fs = batch.stream()
                    .map(o -> CompletableFuture.runAsync(() -> putUnchecked(o, lost, bytes, done, onDone),
                            r -> Thread.ofVirtual().start(r)))
                    .toList();
            // cho moi future xong (ke ca future loi) roi moi bao loi dau tien
            CompletableFuture.allOf(fs.toArray(CompletableFuture[]::new)).handle((v, e) -> null).join();
            for (CompletableFuture<Void> f : fs) {
                try {
                    f.join();
                } catch (CompletionException e) {
                    Throwable c = e.getCause() == null ? e : e.getCause();
                    throw new Exception("upload output that bai: " + c.getMessage(), c);
                }
            }
        }
        for (OutputObject o : last) {
            try {
                put(o, lost, bytes, done, onDone);
            } catch (Exception e) {
                throw new Exception("upload output that bai: " + e.getMessage(), e);
            }
        }
        return bytes.get();
    }

    private void putUnchecked(OutputObject o, BooleanSupplier lost, AtomicLong bytes, AtomicInteger done, IntConsumer onDone) {
        try {
            put(o, lost, bytes, done, onDone);
        } catch (Exception e) {
            throw new CompletionException(e);
        }
    }

    private void put(OutputObject o, BooleanSupplier lost, AtomicLong bytes, AtomicInteger done, IntConsumer onDone) throws Exception {
        long size = Files.size(o.file());
        withRetry("upload " + o.key(), lost, () -> {
            // mo lai stream moi lan thu
            try (InputStream in = Files.newInputStream(o.file())) {
                minio.putObject(PutObjectArgs.builder().bucket(o.bucket()).object(o.key())
                        .stream(in, size, -1)
                        .contentType(o.contentType() == null ? "application/octet-stream" : o.contentType())
                        .build());
            }
            return size;
        });
        bytes.addAndGet(size);
        onDone.accept(done.incrementAndGet());
    }

    private interface Io<T> {
        T call() throws Exception;
    }

    private <T> T withRetry(String what, BooleanSupplier lost, Io<T> op) throws Exception {
        for (int attempt = 0; ; attempt++) {
            try {
                return op.call();
            } catch (Exception e) {
                if (!retryable(e) || attempt >= retryDelays.size() || lost.getAsBoolean()) throw e;
                log.warn("{} loi lan {}: {}, thu lai", what, attempt + 1, e.getMessage());
                Thread.sleep(retryDelays.get(attempt).toMillis());
                if (lost.getAsBoolean()) throw e;
            }
        }
    }

    private static boolean retryable(Exception e) {
        if (e instanceof IOException || e instanceof ServerException) return true;
        return e instanceof ErrorResponseException er && er.response() != null && er.response().code() >= 500;
    }

    public void removeKeys(String bucket, List<String> keys) {
        if (keys.isEmpty()) return;
        try {
            List<DeleteObject> objs = keys.stream().map(DeleteObject::new).toList();
            for (Result<DeleteError> r : minio.removeObjects(
                    RemoveObjectsArgs.builder().bucket(bucket).objects(objs).build())) {
                r.get();
            }
        } catch (Exception e) {
            log.warn("xoa object bucket={} that bai: {}", bucket, e.getMessage());
        }
    }

    public void removePrefix(String bucket, String prefix) {
        try {
            List<String> keys = new ArrayList<>();
            for (Result<Item> r : minio.listObjects(ListObjectsArgs.builder()
                    .bucket(bucket).prefix(prefix).recursive(true).build())) {
                keys.add(r.get().objectName());
            }
            removeKeys(bucket, keys);
        } catch (Exception e) {
            log.warn("xoa prefix {} that bai: {}", prefix, e.getMessage());
        }
    }

    // Xoa prefix cua chinh lan thu nay (best-effort)
    public void removeAttempt(AttemptScope scope, String attemptId) {
        removePrefix(scope.bucket(), scope.parentPrefix() + attemptId + "/");
    }

    // Xoa moi prefix 24-hex duoi parentPrefix tru prefix cua lan thu thang. Khong bao gio xoa prefix thang.
    public void removeLosingAttempts(AttemptScope scope, String winnerAttemptId) {
        try {
            for (Result<Item> r : minio.listObjects(ListObjectsArgs.builder()
                    .bucket(scope.bucket()).prefix(scope.parentPrefix()).recursive(false).build())) {
                Item item = r.get();
                if (!item.isDir()) continue;
                String name = item.objectName().substring(scope.parentPrefix().length());
                if (ATTEMPT_DIR.matcher(name).matches() && !name.startsWith(winnerAttemptId)) {
                    removePrefix(scope.bucket(), item.objectName());
                }
            }
        } catch (Exception e) {
            log.warn("don prefix lan thu thua that bai: {}", e.getMessage());
        }
    }
}
