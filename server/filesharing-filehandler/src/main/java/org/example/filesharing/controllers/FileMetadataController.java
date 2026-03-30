package org.example.filesharing.controllers;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("api/file-metadata")
@RequiredArgsConstructor
@Slf4j
public class FileMetadataController {

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
            return CommonResponse.fail(ErrorCode.INTERNAL_SERVER_ERROR, "uploadId is required");
        }
        if (input.getParts() == null || input.getParts().isEmpty()) {
            log.error("parts list is required");
            return CommonResponse.fail(ErrorCode.INTERNAL_SERVER_ERROR, "parts list is required");
        }
        minIoService.completeMultipartUpload(input.getObjectName(), input.getUploadId(), input.getParts());
        metadataService.completeUpload(input.getObjectName(), input.getUploadId());
        return CommonResponse.success("complete upload");
    }

    @PostMapping("/upload/stop-upload")
    public CommonResponse<String> stopUpload(@RequestBody AbortUploadRequestDto input) {
        minIoService.abortMultipartUpload(input.getObjectName(), input.getUploadId());
        metadataService.uploadFailed(input.getObjectName(), input.getUploadId());
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

            String presignedUrl = minIoService.getPresignedDownloadUrl(input, metadataEntity.getFileSize());

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

    @PostMapping(value = "/direct-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CommonResponse<String> directUpload(@RequestParam("file") MultipartFile file) {
        MetadataDTO dto = new MetadataDTO();
        dto.setFileName(file.getOriginalFilename());
        dto.setObjectName(UUID.randomUUID() + "_" + file.getOriginalFilename());
        dto.setMimeType(file.getContentType());
        dto.setFileSize((double) file.getSize());
        dto.setCompressionAlgo(detectCompressionAlgo(file.getOriginalFilename(), file.getContentType()));

        MetadataEntity response = metadataService.saveMetadata(dto, "");

        return CommonResponse.success(minIoService.uploadSmallFile(file, response.getObjectName()));
    }

    private String detectCompressionAlgo(String fileName, String mimeType) {
        if (fileName == null) return null;
        String lowerName = fileName.toLowerCase();

        if (lowerName.endsWith(".zip") || "application/zip".equals(mimeType)) {
            return "ZIP";
        } else if (lowerName.endsWith(".rar") || mimeType.contains("rar")) {
            return "RAR";
        } else if (lowerName.endsWith(".gz") || lowerName.endsWith(".gzip")) {
            return "GZIP";
        } else if (lowerName.endsWith(".7z")) {
            return "7Z";
        } else if (lowerName.endsWith(".tar")) {
            return "TAR";
        }

        return null;
    }

    @DeleteMapping(value = "/delete/{fileId}")
    public CommonResponse<String> deleteFile(@PathVariable("fileId") String fileId) {
        // trong deleteMetadata đã có deleteFile tại Minio rồi :))
        metadataService.deleteMetadata(fileId);
        return CommonResponse.success();
    }

    @DeleteMapping(value = "/move-to-trash/{fileId}")
    public CommonResponse<String> moveToTrash(@PathVariable("fileId") String fileId) {
        metadataService.moveMetadataToTrash(fileId);
        return CommonResponse.success();
    }

    @PostMapping(value = "/restore-file/{fileId}")
    public CommonResponse<String> restoreFile(@PathVariable("fileId") String fileId) {
        metadataService.restoreFileFromTrash(fileId);
        return CommonResponse.success();
    }

    @GetMapping(value = "/get-file-by-token/{token}")
    public CommonResponse<MetadataEntity> getFileByToken(@PathVariable("token") String token) {
        return CommonResponse.success(metadataService.getFileByToken(token));
    }
}
