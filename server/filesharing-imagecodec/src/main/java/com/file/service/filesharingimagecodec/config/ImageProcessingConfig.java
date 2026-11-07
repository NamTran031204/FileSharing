package com.file.service.filesharingimagecodec.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "image.processing")
@Data
public class ImageProcessingConfig {

    private VipsConfig vips;
    private OutputConfig output;


    @Data
    public static class VipsConfig {
        private int processingTimeoutSeconds;
        // Vuot nguong thi tu choi truoc khi decode (0 = khong gioi han)
        private long maxPixels;
    }

    @Data
    public static class OutputConfig {
        private int webpQuality;
        private boolean stripMetadata;
        private int thumbnailWidth;
    }



}
