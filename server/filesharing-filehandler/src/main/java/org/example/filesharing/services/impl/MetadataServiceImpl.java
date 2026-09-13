package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.file.service.filesharing.core.entity.PageRequestDto;
import com.file.service.filesharing.core.entity.PageResult;
import com.file.service.filesharing.core.entity.models.AssetEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.enums.permission.GrantedProjectPermission;
import org.example.filesharing.entities.dtos.file.EmailSenderRequestDto;
import org.example.filesharing.entities.dtos.file.UserFileFilterPageRequestDto;
import org.example.filesharing.entities.dtos.metadata.DownloadFileRequestDto;
import org.example.filesharing.entities.dtos.metadata.DownloadFileResponseDto;
import org.example.filesharing.entities.dtos.metadata.MetadataDTO;
import org.example.filesharing.entities.dtos.metadata.MetadataUpdateRequestDto;
import org.example.filesharing.entities.dtos.processing.ProcessingJobCreateDTO;
import com.file.service.filesharing.core.entity.models.MetadataEntity;
import com.file.service.filesharing.core.enums.ProcessingJobType;
import com.file.service.filesharing.core.enums.UploadStatus;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.jobs.kafka.EmailProducer;
import org.example.filesharing.jobs.kafka.VideoEncodeProducer;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.services.AssetAccessService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.MetadataService;
import org.example.filesharing.services.MinIoService;
import org.example.filesharing.services.ProcessingService;
import org.example.filesharing.services.StorageService;
import com.file.service.filesharing.core.utils.StringUtils;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MetadataServiceImpl implements MetadataService {

    private final MetadataRepo metadataRepo;
    private final AssetRepo assetRepo;
    private final ProjectRepo projectRepo;
    private final MongoTemplate mongoTemplate;
    private final AuditService auditService;
    private final MinIoService minIoService;
    private final StorageService storageService;
    private final PasswordEncoder passwordEncoder;
    private final EmailProducer emailProducer;
    private final VideoEncodeProducer videoEncodeProducer;
    private final ProcessingService processingService;
    private final AssetAccessService assetAccessService;

    @Override
    public MetadataEntity saveMetadata(MetadataDTO metadataDTO, String uploadId) {
        try {
            String currentUserId = auditService.getCurrentUserId();
            String currentUserEmail = auditService.getCurrentUserEmail();

            com.file.service.filesharing.core.enums.MediaType mediaType = com.file.service.filesharing.core.enums.MediaType.fromMime(metadataDTO.getMimeType());

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
                    .mediaType(mediaType)
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
        if (entity.getMediaType() == com.file.service.filesharing.core.enums.MediaType.VIDEO) {
            entity.setProcessingStatus(com.file.service.filesharing.core.enums.ProcessingStatus.PENDING);
        } else if (entity.getMediaType() != null) {
            entity.setProcessingStatus(com.file.service.filesharing.core.enums.ProcessingStatus.READY);
        }
        metadataRepo.save(entity);

        try {
            if (entity.getMediaType() == com.file.service.filesharing.core.enums.MediaType.VIDEO) {
                videoEncodeProducer.sendEncodeRequest(entity.getFileId(), entity.getObjectName());
            } else {
                processingService.createPendingJob(
                        ProcessingJobCreateDTO.builder()
                                .objectName(entity.getObjectName())
                                .metadataId(entity.getFileId())
                                .assetId(entity.getAssetId())
                                .versionNumber(entity.getVersionNumber())
                                .jobType(ProcessingJobType.TRANSCODE_IMAGE)
                                .build()
                );
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

    @Override
    public MetadataEntity markUploadCompleted(String metadataId, long actualFileSize) {
        MetadataEntity entity = metadataRepo.findById(metadataId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));

        entity.setFileSize(actualFileSize);
        entity.setStatus(UploadStatus.COMPLETED);
        if (entity.getMediaType() == com.file.service.filesharing.core.enums.MediaType.VIDEO) {
            entity.setProcessingStatus(com.file.service.filesharing.core.enums.ProcessingStatus.PENDING);
        } else if (entity.getMediaType() != null) {
            entity.setProcessingStatus(com.file.service.filesharing.core.enums.ProcessingStatus.READY);
        }
        return metadataRepo.save(entity);
    }

    @Override
    public void publishProcessingJob(MetadataEntity entity) {
        try {
            if (entity.getMediaType() == com.file.service.filesharing.core.enums.MediaType.VIDEO) {
                videoEncodeProducer.sendEncodeRequest(entity.getFileId(), entity.getObjectName());
            } else {
                processingService.createPendingJob(
                        ProcessingJobCreateDTO.builder()
                                .objectName(entity.getObjectName())
                                .metadataId(entity.getFileId())
                                .assetId(entity.getAssetId())
                                .versionNumber(entity.getVersionNumber())
                                .jobType(ProcessingJobType.TRANSCODE_IMAGE)
                                .build()
                );
            }
        } catch (Exception e) {
            throw new FileBusinessException(ErrorCode.FILE_ERROR, "Failed to publish processing job: " + e.getMessage());
        }
    }

    @Override
    public void markUploadFailed(String metadataId) {
        MetadataEntity entity = metadataRepo.findById(metadataId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));

        entity.setStatus(UploadStatus.FAILED);
        entity.setIsActive(false);
        metadataRepo.save(entity);
    }

    @Override
    public DownloadFileResponseDto getDownloadUrl(DownloadFileRequestDto request) {
        if (StringUtils.isNullOrBlank(request.getObjectName())) {
            throw new FileBusinessException(ErrorCode.FILE_OBJECT_NAME_CANNOT_BE_EMPTY, "File name cannot be empty");
        }

        MetadataEntity metadata = metadataRepo.findByObjectName(request.getObjectName())
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));

        ensureDownloadPermission(metadata);

        if (metadata.getStatus() != UploadStatus.COMPLETED) {
            throw new FileBusinessException(ErrorCode.FILE_NOT_READY, "File is not ready for download");
        }

        String downloadFileName = StringUtils.isNotNullOrBlank(request.getDownloadFileName())
                ? request.getDownloadFileName()
                : metadata.getFileName();

        long fileSize = resolveFileSize(metadata);
        String url = storageService.presignGetObject(metadata.getObjectName(), downloadFileName, fileSize);

        return DownloadFileResponseDto.builder()
                .url(url)
                .fileSize(fileSize)
                .fileName(metadata.getFileName())
                .mimeType(metadata.getMimeType())
                .contentType(metadata.getMimeType())
                .build();
    }

    private long resolveFileSize(MetadataEntity metadata) {
        if (metadata.getFileSize() != null) {
            return metadata.getFileSize().longValue();
        }
        StorageService.HeadObjectResult head = storageService.headObject(metadata.getObjectName());
        return head.contentLength();
    }

    // -------------------------------------------------------------------------
    // E6 permission check — delegates the project/folder permission structure to
    // AssetAccessService (shared with AssetServiceImpl/ProcessingServiceImpl to avoid
    // both duplicated logic and the circular bean dependency that used to exist here).
    // -------------------------------------------------------------------------

    private void ensureDownloadPermission(MetadataEntity metadata) {
        String currentUserId = auditService.getCurrentUserId();
        if (Objects.equals(metadata.getOwnerId(), currentUserId)) {
            return;
        }

        UserEntity currentUser = auditService.getCurrentUser();
        if (assetAccessService.isAdmin(currentUser)) {
            return;
        }

        if (StringUtils.isNotNullOrBlank(metadata.getAssetId())) {
            AssetEntity asset = assetRepo.findById(metadata.getAssetId()).orElse(null);
            if (asset != null && Boolean.TRUE.equals(asset.getIsActive())) {
                assetAccessService.ensureAssetPermission(asset, GrantedProjectPermission.READ);
                return;
            }
        }

        if (StringUtils.isNotNullOrBlank(metadata.getProjectId())) {
            ProjectEntity project = projectRepo.findById(metadata.getProjectId()).orElse(null);
            if (project != null) {
                assetAccessService.ensureProjectPermission(project, currentUser, GrantedProjectPermission.READ);
                return;
            }
        }

        throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
    }
}
