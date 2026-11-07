package com.file.service.filesharingimagecodec.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

// Upload/download da chuyen sang JobStorage trong core. Chi con ham dung URL thumbnail.
@Component
public class MinioStorageClient {

    private final String thumbnailBucket;
    private final String minioEndpoint;

    public MinioStorageClient(@Value("${minio.buckets.thumbnails}") String thumbnailBucket,
                              @Value("${minio.endpoint}") String minioEndpoint) {
        this.thumbnailBucket = thumbnailBucket;
        this.minioEndpoint = minioEndpoint;
    }

    public String buildThumbnailPublicUrl(String objectKey) {
        return minioEndpoint + "/" + thumbnailBucket + "/" + objectKey;
    }
}
