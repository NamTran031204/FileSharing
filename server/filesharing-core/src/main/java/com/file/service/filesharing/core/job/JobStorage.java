package com.file.service.filesharing.core.job;

import io.minio.DownloadObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.ListObjectsArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectsArgs;
import io.minio.Result;
import io.minio.http.Method;
import io.minio.messages.DeleteError;
import io.minio.messages.DeleteObject;
import io.minio.messages.Item;
import lombok.extern.slf4j.Slf4j;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

@Slf4j
public class JobStorage {
    private static final Pattern ATTEMPT_DIR = Pattern.compile("[0-9a-f]{24}/?");

    private final MinioClient minio;

    public JobStorage(MinioClient minio) {
        this.minio = minio;
    }

    public String presignGet(String bucket, String key, Duration ttl) throws Exception {
        return minio.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                .method(Method.GET).bucket(bucket).object(key)
                .expiry((int) ttl.toSeconds(), TimeUnit.SECONDS).build());
    }

    public void download(String bucket, String key, Path target) throws Exception {
        Files.createDirectories(target.getParent());
        Files.deleteIfExists(target);
        minio.downloadObject(DownloadObjectArgs.builder()
                .bucket(bucket).object(key).filename(target.toString()).build());
    }

    // Object uploadLast=false len song song theo lo, xong het moi toi object uploadLast=true
    public void uploadAll(List<OutputObject> outputs, int batchSize) throws Exception {
        List<OutputObject> first = outputs.stream().filter(o -> !o.uploadLast()).toList();
        List<OutputObject> last = outputs.stream().filter(OutputObject::uploadLast).toList();
        for (int i = 0; i < first.size(); i += batchSize) {
            List<OutputObject> batch = first.subList(i, Math.min(i + batchSize, first.size()));
            CompletableFuture<?>[] fs = batch.stream()
                    .map(o -> CompletableFuture.runAsync(() -> put(o), r -> Thread.ofVirtual().start(r)))
                    .toArray(CompletableFuture[]::new);
            try {
                CompletableFuture.allOf(fs).join();
            } catch (Exception e) {
                throw new Exception("upload output that bai: " + e.getMessage(), e);
            }
        }
        for (OutputObject o : last) {
            try {
                put(o);
            } catch (Exception e) {
                throw new Exception("upload output that bai: " + e.getMessage(), e);
            }
        }
    }

    private void put(OutputObject o) {
        try (InputStream in = Files.newInputStream(o.file())) {
            minio.putObject(PutObjectArgs.builder().bucket(o.bucket()).object(o.key())
                    .stream(in, Files.size(o.file()), -1)
                    .contentType(o.contentType() == null ? "application/octet-stream" : o.contentType())
                    .build());
        } catch (Exception e) {
            throw new IllegalStateException(e.getMessage(), e);
        }
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
