package org.example.filesharing.configurations;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*")
                .allowedMethods(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE"
                )
                .allowedHeaders("*")
                .allowCredentials(false);
        registry.addMapping("/v3/api-docs/**")
                .allowedOrigins("*")
                .allowedMethods("GET");

        registry.addMapping("/swagger-ui/**")
                .allowedOrigins("*")
                .allowedMethods("GET");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }
}
