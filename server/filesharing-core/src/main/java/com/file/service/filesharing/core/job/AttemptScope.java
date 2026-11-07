package com.file.service.filesharing.core.job;

// Output nhieu object nam duoi parentPrefix + attemptId + "/". Dung de don prefix cua lan thu thua.
public record AttemptScope(String bucket, String parentPrefix) {
}
