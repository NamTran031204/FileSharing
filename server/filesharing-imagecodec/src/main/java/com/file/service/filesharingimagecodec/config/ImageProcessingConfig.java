package com.file.service.filesharingimagecodec.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "image.processing")
@Data
public class ImageProcessingConfig {

    private VipsConfig vips;
    private OutputConfig output;

    @Data
    public static class VipsConfig {
        // Duong dan vips / vipsheader (env VIPS_PATH, VIPSHEADER_PATH)
        private String path;
        private String headerPath;
        // Timeout moi lan chay cong cu (vipsheader, vips thumbnail)
        private int processingTimeoutSeconds;
        // Vuot nguong thi tu choi truoc khi decode (0 = khong gioi han)
        private long maxPixels;
        // VIPS_CONCURRENCY: thread moi tien trinh; bulkhead x concurrency <= so core
        private int concurrency = 2;
        // Loader vipsheader bao phai thuoc danh sach nay, khong thi permanent
        private List<String> allowedLoaders;
    }

    @Data
    public static class OutputConfig {
        private int webpQuality;
        private int webpEffort = 6;
        private int thumbnailWidth;
        // Canh dai toi da cua preview, anh nho hon giu nguyen
        private int previewMaxEdge = 2560;
    }
}
