package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.file.UserFileFilterPageRequestDto;
import org.example.filesharing.entities.dtos.metadata.MetadataDTO;
import org.example.filesharing.entities.dtos.metadata.MetadataUpdateRequestDto;
import org.example.filesharing.entities.models.MetadataEntity;
import org.example.filesharing.entities.models.UserFilePermission;
import org.example.filesharing.enums.UploadStatus;
import org.example.filesharing.enums.objectPermission.ObjectPermission;
import org.example.filesharing.enums.objectPermission.ObjectVisibility;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.exceptions.specException.FileBusinessException;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.MetadataService;
import org.example.filesharing.services.MinIoService;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class MetadataServiceImpl implements MetadataService {

    private final MetadataRepo metadataRepo;
    private final MongoTemplate mongoTemplate;
    private final AuditService auditService;
    private final MinIoService minIoService;

    @Override
    public MetadataEntity saveMetadata(MetadataDTO metadataDTO, String uploadId) {
        try {
            String currentUserId = auditService.getCurrentUserId();

            MetadataEntity metadataEntity = MetadataEntity.builder()
                    .fileName(metadataDTO.getFileName())
                    .objectName(metadataDTO.getObjectName())
                    .mimeType(metadataDTO.getMimeType())
                    .fileSize(metadataDTO.getFileSize())
                    .compressionAlgo(metadataDTO.getCompressionAlgo())
                    .ownerId(currentUserId)
                    .uploadId(uploadId)
                    .timeToLive(metadataDTO.getTimeToLive())
                    .status(UploadStatus.UPLOADING)
                    .isActive(true)
                    .publicPermission(ObjectPermission.READ) // mac dinh la read
                    .visibility(ObjectVisibility.PRIVATE)
                    .build();

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
        metadataRepo.save(entity);
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
    public MetadataEntity updateMetadata(MetadataUpdateRequestDto input, String fileId) {
        MetadataEntity entity = metadataRepo.findById(fileId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));

        String currentUserId = auditService.getCurrentUserId();
        boolean ok = true;
        if (!currentUserId.equals(entity.getOwnerId())) {
            if (entity.getVisibility().equals(ObjectVisibility.PUBLIC)) {
                if (!entity.getPublicPermission().equals(ObjectPermission.MODIFY)) {
                    ok = false;
                }
            } else {
                var userFilePermission = entity.getUserFilePermissions();
                ok = false;
                for (var user : userFilePermission) {
                    if (user.getEmail().equals(auditService.getCurrentUserEmail())) {
                        for (var permission : user.getPermissionList()) {
                            if (permission.equals(ObjectPermission.MODIFY)) {
                                ok = true;
                                break;
                            }
                        }
                        break;
                    }
                }
            }
        }
        if (!ok) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }

        if (input.getFileName() != null) {
            entity.setFileName(input.getFileName());
        }

        // chinh sach time to live la cong them, roi so sanh voi uploadTime (Creation Time) de tinh execute
        if (input.getTimeToLive() != null) {
            int currentTTL = entity.getTimeToLive();
            int additionalTTL = input.getTimeToLive() > 0 ? input.getTimeToLive() : 0;
            entity.setTimeToLive(currentTTL + additionalTTL);
        }

        if (input.getPublicPermission() != null) {
            entity.setPublicPermission(input.getPublicPermission());
        }

        if (input.getVisibility() != null) {
            entity.setVisibility(input.getVisibility());
        }

        if (input.getUserFilePermissions() != null && !input.getUserFilePermissions().isEmpty()) {
            // Tạo map từ input để dễ tra cứu
            Map<String, List<ObjectPermission>> inputPermissionMap = new HashMap<>();
            input.getUserFilePermissions().forEach(ufp ->
                    inputPermissionMap.put(ufp.getEmail(), ufp.getPermissionList())
            );

            // Lấy danh sách permission hiện tại hoặc tạo mới nếu null
            List<UserFilePermission> currentPermissions = entity.getUserFilePermissions();
            if (currentPermissions == null) {
                currentPermissions = new ArrayList<>();
            }

            // Tạo map từ danh sách hiện tại
            Map<String, UserFilePermission> currentPermissionMap = new HashMap<>();
            currentPermissions.forEach(ufp -> currentPermissionMap.put(ufp.getEmail(), ufp));

            // Cập nhật hoặc thêm mới permission cho từng user
            for (Map.Entry<String, List<ObjectPermission>> entry : inputPermissionMap.entrySet()) {
                String email = entry.getKey();
                List<ObjectPermission> newPermissions = entry.getValue();

                if (currentPermissionMap.containsKey(email)) {
                    // User đã tồn tại -> merge permissions (thêm các permission chưa có)
                    UserFilePermission existingUfp = currentPermissionMap.get(email);
                    List<ObjectPermission> existingPermissions = existingUfp.getPermissionList();

                    if (existingPermissions == null) {
                        existingPermissions = new ArrayList<>();
                    }

                    // Thêm các permission mới chưa có trong danh sách hiện tại
                    for (ObjectPermission newPerm : newPermissions) {
                        if (!existingPermissions.contains(newPerm)) {
                            existingPermissions.add(newPerm);
                        }
                    }
                    existingUfp.setPermissionList(existingPermissions);
                } else {
                    // User chưa tồn tại -> tạo mới
                    UserFilePermission newUfp = UserFilePermission.builder()
                            .email(email)
                            .permissionList(new ArrayList<>(newPermissions))
                            .build();
                    currentPermissions.add(newUfp);
                    currentPermissionMap.put(email, newUfp);
                }
            }

            entity.setUserFilePermissions(currentPermissions);
        }

        return metadataRepo.save(entity);
    }

    @Override
    public PageResult<MetadataEntity> getFilesByFilter(PageRequestDto<UserFileFilterPageRequestDto> input) {

        Query query = new Query();

        UserFileFilterPageRequestDto filter = input.getFilter();

        query.addCriteria(
                Criteria.where("ownerId").is(auditService.getCurrentUserId())
        );
        if (filter != null) {

            if (filter.getMimeType() != null) {
                query.addCriteria(Criteria.where("mimeType").is(filter.getMimeType()));
            }

            if (filter.getStatus() != null) {
                query.addCriteria(Criteria.where("status").is(filter.getStatus()));
            }

            if (filter.getIsActive() != null) {
                query.addCriteria(Criteria.where("isActive").is(filter.getIsActive()));
            }

            if (filter.getIsIncludeSharedFile() == null) {
                filter.setIsIncludeSharedFile(false);
            }

            // TODO: xu ly nghiep vu lay ra cac file duoc chia se theo userFilePermissions

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

        minIoService.deleteFile(metadataEntity.getObjectName());
        metadataRepo.delete(metadataEntity);
    }

}
