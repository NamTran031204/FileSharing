package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.dtos.asset.ImageViewDataDto;
import org.example.filesharing.entities.dtos.metadata.DownloadFileRequestDto;
import org.example.filesharing.entities.models.MetadataEntity;
import org.example.filesharing.enums.ProcessingStatus;
import org.example.filesharing.services.AssetService;
import org.example.filesharing.services.MinIoService;
import org.example.filesharing.services.SseService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("api")
@RequiredArgsConstructor
@Slf4j
public class ImageDataController {

    private final AssetService assetService;
    private final MinIoService minIoService;
    private final SseService sseService;

    @Value("${minio.buckets.image-preview}")
    private String imagePreviewBucket;

    @GetMapping("/asset/{assetId}/image-data")
    public CommonResponse<ImageViewDataDto> getImageData(@PathVariable("assetId") String assetId) {
        MetadataEntity version = assetService.getLatestVersion(assetId);

        ImageViewDataDto.ImageViewDataDtoBuilder builder = ImageViewDataDto.builder()
                .assetId(assetId)
                .mimeType(version.getMimeType())
                .processingStatus(version.getProcessingStatus())
                .thumbnailUrl(version.getThumbnailUrl());

        if (version.getMediaInfo() != null) {
            builder.dimensions(ImageViewDataDto.DimensionDto.builder()
                    .width(version.getMediaInfo().getWidth())
                    .height(version.getMediaInfo().getHeight())
                    .build());
        }

        if (version.getProcessingStatus() == ProcessingStatus.READY && version.getObjectName() != null) {
            try {
                String previewUrl = minIoService.generatePresignedUrl(
                        imagePreviewBucket, version.getObjectName(), 30 * 60);
                builder.previewUrl(previewUrl);
            } catch (Exception e) {
                log.error("failed to generate preview URL for asset {}: {}", assetId, e.getMessage());
            }

            try {
                DownloadFileRequestDto dlReq = new DownloadFileRequestDto();
                dlReq.setObjectName(version.getObjectName());
                String originalUrl = minIoService.getPresignedDownloadUrl(dlReq, version.getFileSize());
                builder.originalUrl(originalUrl);
            } catch (Exception e) {
                log.error("failed to generate original URL for asset {}: {}", assetId, e.getMessage());
            }
        }

        return CommonResponse.success(builder.build());
    }

    @GetMapping(value = "/folder/{folderId}/asset-status-stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeToFolderStatus(@PathVariable("folderId") String folderId) {
        return sseService.subscribe(folderId);
    }
}
