package com.file.service.filesharingvideocodec;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class FilesharingVideocodecApplication {

    public static void main(String[] args) {
        SpringApplication.run(FilesharingVideocodecApplication.class, args);
    }

}
