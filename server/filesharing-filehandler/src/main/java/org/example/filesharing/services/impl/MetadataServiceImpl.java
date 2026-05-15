package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.file.EmailSenderRequestDto;
import org.example.filesharing.entities.dtos.file.UserFileFilterPageRequestDto;
import org.example.filesharing.entities.dtos.metadata.MetadataDTO;
import org.example.filesharing.entities.dtos.metadata.MetadataUpdateRequestDto;
import org.example.filesharing.entities.models.MetadataEntity;
import org.example.filesharing.enums.UploadStatus;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.exceptions.specException.FileBusinessException;
import org.example.filesharing.jobs.kafka.EmailProducer;
import org.example.filesharing.jobs.kafka.VideoEncodeProducer;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.MetadataService;
import org.example.filesharing.services.MinIoService;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MetadataServiceImpl implements MetadataService {

    private final MetadataRepo metadataRepo;
    private final MongoTemplate mongoTemplate;
    private final AuditService auditService;
    private final MinIoService minIoService;
    private final PasswordEncoder passwordEncoder;
    private final EmailProducer emailProducer;
    private final VideoEncodeProducer videoEncodeProducer;

    @Override
    public MetadataEntity saveMetadata(MetadataDTO metadataDTO, String uploadId) {
        try {
            String currentUserId = auditService.getCurrentUserId();
            String currentUserEmail = auditService.getCurrentUserEmail();

            MetadataEntity metadataEntity = MetadataEntity.builder()
                    .fileName(metadataDTO.getFileName())
                    .objectName(metadataDTO.getObjectName())
                    .ownerEmail(currentUserEmail)
                    .mimeType(metadataDTO.getMimeType())
                    .fileSize(metadataDTO.getFileSize())
                    .compressionAlgo(metadataDTO.getCompressionAlgo())
                    .ownerId(currentUserId)
                    .uploadId(uploadId)
                    .status(UploadStatus.UPLOADING)
                    .isActive(true)
                    .isTrash(false)
                    .build();

            if (metadataDTO.getTimeToLive() == null) {
                metadataDTO.setTimeToLive(Integer.MAX_VALUE);
            }
            metadataEntity.setTimeToLive(metadataDTO.getTimeToLive());

            String encodeInfo = UUID.randomUUID().toString();
            metadataEntity.setShareToken(passwordEncoder.encode(encodeInfo));

            return metadataRepo.save(metadataEntity);

        } catch (Exception e) {
            throw new RuntimeException("Failed to save metadata: " + e.getMessage(), e);
        }
    }

    @Override
    public void completeUpload(String objectName, String uploadId) {
        MetadataEntity entity = metadataRepo.findByObjectNameAndUploadId(objectName, uploadId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));

        String currentUserId = auditService.getCurrentUserId();
        if (!currentUserId.equals(entity.getOwnerId())) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }

        entity.setStatus(UploadStatus.COMPLETED);
        if (entity.getMediaType() == org.example.filesharing.enums.MediaType.VIDEO) {
            entity.setProcessingStatus(org.example.filesharing.enums.ProcessingStatus.PENDING);
        } else if (entity.getMediaType() != null) {
            entity.setProcessingStatus(org.example.filesharing.enums.ProcessingStatus.READY);
        }
        metadataRepo.save(entity);

        try {
            if (entity.getMediaType() == org.example.filesharing.enums.MediaType.VIDEO) {
                videoEncodeProducer.sendEncodeRequest(entity.getFileId(), entity.getObjectName());
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void uploadFailed(String objectName, String uploadId) {
        MetadataEntity entity = metadataRepo.findByObjectNameAndUploadId(objectName, uploadId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));

        String currentUserId = auditService.getCurrentUserId();
        if (!currentUserId.equals(entity.getOwnerId())) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }

        entity.setStatus(UploadStatus.FAILED);
        entity.setIsActive(false);
        metadataRepo.save(entity);
    }

    @Override
    public List<Integer> resumeUpload(String uploadId) {
        return List.of();
    }

    @Override
    public Boolean addUserViaEmail(EmailSenderRequestDto input) {
        emailProducer.sendEmail(input);
        return true;
    }

    @Override
    public MetadataEntity updateMetadata(MetadataUpdateRequestDto input, String fileId) {
        MetadataEntity entity = metadataRepo.findById(fileId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));

        String currentUserEmail = auditService.getCurrentUserEmail();
        if (!currentUserEmail.equals(entity.getOwnerEmail())) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }

        if (input.getFileName() != null) {
            entity.setFileName(input.getFileName());
        }

        if (input.getTimeToLive() != null) {
            int currentTTL = entity.getTimeToLive();
            int additionalTTL = input.getTimeToLive() > 0 ? input.getTimeToLive() : 0;
            entity.setTimeToLive(currentTTL + additionalTTL);
        }

        return metadataRepo.save(entity);
    }

    @Override
    public PageResult<MetadataEntity> getFilesByFilter(PageRequestDto<UserFileFilterPageRequestDto> input) {

        Query query = new Query();

        UserFileFilterPageRequestDto filter = input.getFilter();

        String currentUserId = auditService.getCurrentUserId();

        query.addCriteria(Criteria.where("ownerId").is(currentUserId));

        if (filter != null) {

            if (filter.getMimeType() != null) {
                query.addCriteria(Criteria.where("mimeType").is(filter.getMimeType()));
            }

            if (filter.getStatus() != null) {
                query.addCriteria(Criteria.where("status").is(filter.getStatus()));
            }

            if (filter.getIsTrash() != null) {
                query.addCriteria(Criteria.where("isTrash").is(filter.getIsTrash()));
            }

            if (filter.getIsActive() != null) {
                query.addCriteria(Criteria.where("isActive").is(filter.getIsActive()));
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

    @Override
    public void deleteMetadata(String fileId) {
        MetadataEntity metadataEntity = metadataRepo.findById(fileId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));

        String currentUserId = auditService.getCurrentUserId();
        if (!currentUserId.equals(metadataEntity.getOwnerId())) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }

        minIoService.deleteFile(metadataEntity.getObjectName());
        metadataRepo.delete(metadataEntity);
    }

    @Override
    public void moveMetadataToTrash(String fileId) {
        MetadataEntity entity = metadataRepo.findById(fileId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));
        String currentUserId = auditService.getCurrentUserId();
        if (!currentUserId.equals(entity.getOwnerId())) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }
        entity.setIsTrash(true);
        metadataRepo.save(entity);
    }

    @Override
    public void restoreFileFromTrash(String fileId) {
        MetadataEntity entity = metadataRepo.findById(fileId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));
        String currentUserId = auditService.getCurrentUserId();
        if (!currentUserId.equals(entity.getOwnerId())) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }
        entity.setIsTrash(false);
        metadataRepo.save(entity);
    }

    @Override
    public MetadataEntity getFileByToken(String token) {
        MetadataEntity metadata = metadataRepo.findByShareToken(token)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));
        return metadata;
    }

    @Override
    public MetadataEntity checkUserOnFile(String shareToken) {
        return metadataRepo.findByShareToken(shareToken)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));
    }
}
