package com.file.service.filesharingimagerawproccess.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties("raw.processing")
public class RawProcessingConfig {
    // Duong dan exiftool (env EXIFTOOL_PATH), mac dinh tim trong PATH
    private String exiftoolPath = "exiftool";
    // command-timeout, lock-wait doc tu RuntimeSettings (raw.*)
}
