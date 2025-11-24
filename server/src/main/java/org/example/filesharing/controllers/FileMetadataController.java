package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.AbortUploadRequestDto;
import org.example.filesharing.entities.dtos.CompleteUploadRequest;
import org.example.filesharing.entities.dtos.MetadataDTO;
import org.example.filesharing.services.MetadataService;
import org.example.filesharing.services.MinIoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("api/file-metadata")
@RequiredArgsConstructor
public class FileMetadataController {

    private final MetadataService metadataService;
    private final MinIoService minIoService;

    @PostMapping("/upload-metadata")
    public ResponseEntity<?> uploadMetadata(@RequestBody MetadataDTO metadataDTO) {
        try {
            String uploadId = minIoService.initiateMultipartUpload(metadataDTO.getFileName());
            metadataService.saveMetadata(metadataDTO, uploadId);
            return ResponseEntity.ok(uploadId);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    Map.of("error", "Failed to save metadata: " + e.getMessage())
            );
        }
    }

    @PostMapping("/upload/complete")
    public ResponseEntity<?> uploadComplete(@RequestBody CompleteUploadRequest input) {
        minIoService.completeMultipartUpload(input.getObjectName(), input.getUploadId(), input.getParts());
        return ResponseEntity.ok("complete upload");
    }

    @PostMapping("/upload/stop-upload")
    public ResponseEntity<?> stopUpload(@RequestBody AbortUploadRequestDto input) {
        minIoService.abortMultipartUpload(input.getObjectName(), input.getUploadId());
        return ResponseEntity.ok("stopped upload");
    }
}
