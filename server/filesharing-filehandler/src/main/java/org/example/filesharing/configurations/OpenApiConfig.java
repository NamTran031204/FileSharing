package org.example.filesharing.configurations;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private String serverPort;

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
                // Thêm server URLs
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("Local Development Server"),
                        new Server()
                                .url("https://api.filesharing.com")
                                .description("Production Server")
                ))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter JWT token")));
    }

    @Bean
    public OperationCustomizer operationIdCustomizer() {
        return (operation, handlerMethod) -> {
            // Sử dụng tên method làm operationId
            String methodName = handlerMethod.getMethod().getName();
            operation.setOperationId(methodName);
            return operation;
        };
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