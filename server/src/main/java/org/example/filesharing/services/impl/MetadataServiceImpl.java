package org.example.filesharing.services.impl;

import io.minio.MinioClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.file.UserFileFilterPageRequestDto;
import org.example.filesharing.entities.dtos.metadata.MetadataDTO;
import org.example.filesharing.entities.models.MetadataEntity;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.services.MetadataService;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MetadataServiceImpl implements MetadataService {

    private final MetadataRepo metadataRepo;
    private final MinioClient minioClient;
    private final MongoTemplate mongoTemplate;

    @Override
    public void saveMetadata(MetadataDTO metadataDTO, String uploadId) {
        try {
            MetadataEntity metadataEntity = MetadataEntity.builder()
                    .fileName(metadataDTO.getFileName())
                    .objectName(metadataDTO.getObjectName())
                    .mimeType(metadataDTO.getMimeType())
                    .fileSize(metadataDTO.getFileSize())
                    .compressionAlgo(metadataDTO.getCompressionAlgo())
                    .ownerId(metadataDTO.getOwnerId())
                    .creationTimestamp(metadataDTO.getCreationTimestamp())
                    .uploadId(uploadId)
                    .timeToLive(metadataDTO.getTimeToLive())
                    .build();

            MetadataEntity savedMetadataEntity = metadataRepo.save(metadataEntity);

        } catch (Exception e) {
            throw new RuntimeException("Failed to save metadata: " + e.getMessage(), e);
        }
    }

    @Override
    public List<Integer> resumeUpload(String uploadId) {
        return List.of();
    }

    @Override
    public PageResult<MetadataEntity> getFilesByFilter(PageRequestDto<UserFileFilterPageRequestDto> input) {

        Query query = new Query();

        UserFileFilterPageRequestDto filter = input.getFilter();

        if (filter != null) {
            if (filter.getOwnerId() != null) {
                query.addCriteria(
                        Criteria.where("ownerId").is(filter.getOwnerId())
                );
            }
            if (filter.getMimeType() != null) {
                query.addCriteria(Criteria.where("mimeType").is(filter.getMimeType()));
            }
            if (filter.getCreationTimestampStartDate() != null && filter.getCreationTimestampEndDate() != null) {
                query.addCriteria(Criteria.where("creationTimestamp").gte(filter.getCreationTimestampStartDate()).lte(filter.getCreationTimestampEndDate()));
            } else if (filter.getCreationTimestampStartDate() != null) {
                query.addCriteria(Criteria.where("creationTimestamp").gte(filter.getCreationTimestampStartDate()));
            } else if (filter.getCreationTimestampEndDate() != null) {
                query.addCriteria(Criteria.where("creationTimestamp").lte(filter.getCreationTimestampEndDate()));
            }
        }

        long count = mongoTemplate.count(query, MetadataEntity.class);

        query.with(input.getPageRequest());

        List<MetadataEntity> metadataEntityList = mongoTemplate.find(query, MetadataEntity.class);

        PageResult<MetadataEntity> pageResult = new PageResult<>();
        pageResult.setTotalCount(count);
        pageResult.setData(metadataEntityList);

        return pageResult;
    }

}
