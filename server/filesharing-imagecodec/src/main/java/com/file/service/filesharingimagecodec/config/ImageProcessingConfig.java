package com.file.service.filesharingimagecodec.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "image.processing")
@Data
public class ImageProcessingConfig {

    private VipsConfig vips;

    @Data
    public static class VipsConfig {
        // Duong dan vips / vipsheader (env VIPS_PATH, VIPSHEADER_PATH)
        private String path;
        private String headerPath;
        // timeout, max-pixels, concurrency, allowed-loaders doc tu RuntimeSettings (image.*)
    }

}
