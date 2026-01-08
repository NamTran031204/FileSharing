package org.example.filesharing.configurations;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("File Sharing API")
                        .version("1.0.0")
                        .description("API for File Sharing Application - Upload, Download, Share files")
                        .contact(new Contact()
                                .name("File Sharing Team")
                                .email("support@filesharing.com"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter JWT token")));
    }

    // Group cho Auth APIs
    @Bean
    public GroupedOpenApi authApi() {
        return GroupedOpenApi.builder()
                .group("1. Authentication")
                .pathsToMatch("/api/auth/**")
                .build();
    }

    // Group cho File APIs
    @Bean
    public GroupedOpenApi fileApi() {
        return GroupedOpenApi.builder()
                .group("2. File Operations")
                .pathsToMatch("/api/files/**")
                .build();
    }

    // Group cho Metadata APIs
    @Bean
    public GroupedOpenApi metadataApi() {
        return GroupedOpenApi.builder()
                .group("3. File Metadata")
                .pathsToMatch("/api/metadata/**")
                .build();
    }

    // Group cho tất cả APIs
    @Bean
    public GroupedOpenApi allApi() {
        return GroupedOpenApi.builder()
                .group("All APIs")
                .pathsToMatch("/api/**")
                .build();
    }

    @Bean
    public OpenApiCustomizer globalResponseCustomizer() {
        return openApi -> openApi.getPaths().values()
                .forEach(pathItem -> pathItem.readOperations()
                        .forEach(operation -> {
                            if (operation.getResponses() != null) {
                                operation.getResponses()
                                        .addApiResponse("401",
                                                new io.swagger.v3.oas.models.responses.ApiResponse()
                                                        .description("Unauthorized - Invalid or missing JWT token"))
                                        .addApiResponse("403",
                                                new io.swagger.v3.oas.models.responses.ApiResponse()
                                                        .description("Forbidden - Access denied"))
                                        .addApiResponse("500",
                                                new io.swagger.v3.oas.models.responses.ApiResponse()
                                                        .description("Internal Server Error"));
                            }
                        }));
    }
}