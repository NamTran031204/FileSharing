package org.example.filesharing.services.impl;

import io.minio.MinioClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.dtos.*;
import org.example.filesharing.entities.models.Chunk;
import org.example.filesharing.entities.models.Metadata;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.services.MetadataService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MetadataServiceImpl implements MetadataService {

    private final MetadataRepo metadataRepo;
    private final MinioClient minioClient;

    @Override
    public void saveMetadata(MetadataDTO metadataDTO, String uploadId) {
        try {
            Metadata metadata = Metadata.builder()
                    .fileName(metadataDTO.getFileName())
                    .mimeType(metadataDTO.getMimeType())
                    .fileSize(metadataDTO.getFileSize())
                    .compressionAlgo(metadataDTO.getCompressionAlgo())
                    .ownerId(metadataDTO.getOwnerId())
                    .creationTimestamp(metadataDTO.getCreationTimestamp())
                    .uploadId(uploadId)
                    .timeToLive(metadataDTO.getTimeToLive())
                    .build();

            Metadata savedMetadata = metadataRepo.save(metadata);

        } catch (Exception e) {
            throw new RuntimeException("Failed to save metadata: " + e.getMessage(), e);
        }
    }
}
