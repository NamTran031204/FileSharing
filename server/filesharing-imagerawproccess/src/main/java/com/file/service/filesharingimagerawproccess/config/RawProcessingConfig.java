package com.file.service.filesharingimagerawproccess.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@Data
@ConfigurationProperties("raw.processing")
public class RawProcessingConfig {
    // Duong dan exiftool (env EXIFTOOL_PATH), mac dinh tim trong PATH
    private String exiftoolPath = "exiftool";
    // Timeout moi lenh trong phien, tinh tu luc da giu khoa phien
    private Duration commandTimeout = Duration.ofSeconds(30);
    // Thoi gian toi da cho khoa phien
    private Duration lockWait = Duration.ofSeconds(60);
}
