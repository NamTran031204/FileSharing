package com.file.service.filesharing.core.job;

import java.nio.file.Path;

// uploadLast = true: chi upload sau khi moi object uploadLast = false da xong (vi du index.m3u8)
public record OutputObject(String bucket, String key, Path file, String contentType, boolean uploadLast) {
}
