package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.dtos.chunk.AbortUploadRequestDto;
import org.example.filesharing.entities.dtos.chunk.CompleteUploadRequest;
import org.example.filesharing.entities.dtos.metadata.DownloadFileRequestDto;
import org.example.filesharing.entities.dtos.metadata.DownloadFileResponseDto;
import org.example.filesharing.entities.dtos.metadata.InitiateUploadResponseDto;
import org.example.filesharing.entities.dtos.metadata.MetadataDTO;
import org.example.filesharing.entities.models.MetadataEntity;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.services.MetadataService;
import org.example.filesharing.services.MinIoService;
import org.example.filesharing.utils.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/file-metadata")
@RequiredArgsConstructor
public class FileMetadataController {

    private static final Logger log = LoggerFactory.getLogger(FileMetadataController.class);
    private final MetadataService metadataService;
    private final MinIoService minIoService;
    private final MetadataRepo metadataRepo;

    @PostMapping("/upload-metadata")
    public CommonResponse<InitiateUploadResponseDto> startUpload(@RequestBody MetadataDTO metadataDTO) {
        try {
            if (StringUtils.isNullOrBlank(metadataDTO.getObjectName())) {
                return CommonResponse.fail(ErrorCode.INTERNAL_SERVER_ERROR, "objectName is required");
            }

            InitiateUploadResponseDto responseDto = minIoService.initiateMultipartUpload(metadataDTO.getObjectName(), metadataDTO.getFileSize());
            metadataService.saveMetadata(metadataDTO, responseDto.getUploadId());
            return CommonResponse.success(responseDto);
        } catch (Exception e) {
            return CommonResponse.fail(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to save metadata: " + e.getMessage());
        }
    }

    @PostMapping("/upload/complete")
    public CommonResponse<String> uploadComplete(@RequestBody CompleteUploadRequest input) {
        if (input.getObjectName() == null || input.getObjectName().isBlank()) {
            log.error("objectName is required");
            return CommonResponse.fail(ErrorCode.INTERNAL_SERVER_ERROR, "objectName is required");
        }
        if (input.getUploadId() == null || input.getUploadId().isBlank()) {
            log.error("uploadId is required");
            return CommonResponse.fail(ErrorCode.INTERNAL_SERVER_ERROR,"uploadId is required");
        }
        if (input.getParts() == null || input.getParts().isEmpty()) {
            log.error("parts list is required");
            return CommonResponse.fail(ErrorCode.INTERNAL_SERVER_ERROR,"parts list is required");
        }

        minIoService.completeMultipartUpload(input.getObjectName(), input.getUploadId(), input.getParts());
        return CommonResponse.success("complete upload");
    }

    @PostMapping("/upload/stop-upload")
    public CommonResponse<String> stopUpload(@RequestBody AbortUploadRequestDto input) {
        minIoService.abortMultipartUpload(input.getObjectName(), input.getUploadId());
        return CommonResponse.success("stopped upload");
    }

    // trả về download url phục vụ cho range header request
    @PostMapping("/download")
    public CommonResponse<DownloadFileResponseDto> downloadFile(@RequestBody DownloadFileRequestDto input) {
        try {
            MetadataEntity metadataEntity = metadataRepo.findByObjectName(input.getObjectName())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid object name: " + input.getObjectName()));
            String fileName = metadataEntity.getFileName();
            if (input.getDownloadFileName() == null || input.getDownloadFileName().isBlank()) {
                input.setDownloadFileName(fileName);
            }

            if (input.getExpireTime() == 0) {
                input.setExpireTime(100000);
            }

            String presignedUrl = minIoService.getPresignedDownloadUrl(input);

            // Trả về cả URL và fileSize
            return CommonResponse.success(DownloadFileResponseDto.builder()
                            .url(presignedUrl)
                            .fileSize(metadataEntity.getFileSize())
                            .fileName(fileName)
                            .mimeType(metadataEntity.getMimeType())
                    .build());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
