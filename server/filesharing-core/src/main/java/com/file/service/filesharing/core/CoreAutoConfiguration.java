package com.file.service.filesharing.core;

import com.file.service.filesharing.core.config.JacksonConfig;
import com.file.service.filesharing.core.config.MinIOConfig;
import com.file.service.filesharing.core.exceptions.GlobalExceptionHandler;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Import;

@AutoConfiguration
@Import({MinIOConfig.class, JacksonConfig.class})
public class CoreAutoConfiguration {

    @AutoConfiguration
    @ConditionalOnWebApplication
    @Import(GlobalExceptionHandler.class)
    static class WebAutoConfiguration {
    }
}
