package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.auth.UserFileAuthPermissionRequestDto;
import org.example.filesharing.entities.dtos.file.UserFileFilterPageRequestDto;
import org.example.filesharing.entities.dtos.metadata.MetadataDTO;
import org.example.filesharing.entities.dtos.metadata.MetadataUpdateRequestDto;
import org.example.filesharing.entities.models.MetadataEntity;
import org.example.filesharing.entities.models.UserFilePermission;
import org.example.filesharing.enums.UploadStatus;
import org.example.filesharing.enums.objectPermission.FileAppPermission;
import org.example.filesharing.enums.objectPermission.ObjectPermission;
import org.example.filesharing.enums.objectPermission.ObjectVisibility;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.exceptions.specException.FileBusinessException;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.MetadataService;
import org.example.filesharing.services.MinIoService;
import org.example.filesharing.utils.PermissionUtil;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MetadataServiceImpl implements MetadataService {

    private final MetadataRepo metadataRepo;
    private final MongoTemplate mongoTemplate;
    private final AuditService auditService;
    private final MinIoService minIoService;
    private final PasswordEncoder passwordEncoder;

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
                    .publicPermission(ObjectPermission.READ) // mac dinh la read
                    .visibility(ObjectVisibility.PRIVATE)
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
    public Boolean addUserViaEmail(String objectName, String email, List<ObjectPermission> permission) {
        MetadataEntity metadataEntity = metadataRepo.findByObjectName(objectName)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));
        List<UserFilePermission> result = mergeUserPermissions(List.of(UserFilePermission.builder()
                        .email(email)
                        .permissionList(permission)
                .build()), metadataEntity.getUserFilePermissions());

        metadataEntity.setUserFilePermissions(result);
        metadataRepo.save(metadataEntity);
        return true;
    }

    @Override
    public MetadataEntity updateMetadata(MetadataUpdateRequestDto input, String fileId) {
        MetadataEntity entity = metadataRepo.findById(fileId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));

        String currentUserEmail = auditService.getCurrentUserEmail();

        if (!hasEditPermissionOnFile(entity, currentUserEmail)) {
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
            List<UserFilePermission> currentPermissions = mergeUserPermissions(input.getUserFilePermissions(), entity.getUserFilePermissions());
            entity.setUserFilePermissions(currentPermissions);
        }

        return metadataRepo.save(entity);
    }

    @Override
    public PageResult<MetadataEntity> getFilesByFilter(PageRequestDto<UserFileFilterPageRequestDto> input) {

        Query query = new Query();

        UserFileFilterPageRequestDto filter = input.getFilter();

        String currentUserEmail = auditService.getCurrentUserEmail();
        String currentUserId = auditService.getCurrentUserId();

        Criteria ownerCriteria = Criteria.where("ownerId").is(currentUserId);

        if (filter != null && filter.getIsIncludeSharedFile() != null && filter.getIsIncludeSharedFile()) {
            // Lấy cả file của owner và file được chia sẻ
            Criteria sharedCriteria = Criteria.where("userFilePermissions").elemMatch(
                    Criteria.where("email").is(currentUserEmail)
                            .and("permissionList").ne(null).ne(Collections.emptyList())
            );
            query.addCriteria(new Criteria().orOperator(ownerCriteria, sharedCriteria));
        } else {
            // Chỉ lấy file của owner
            query.addCriteria(ownerCriteria);
        }
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

        for (var metadata: metadataEntityList) {
            if (metadata.getOwnerId().equals(currentUserId)) {
                metadata.setPublishUserPermission(PermissionUtil.calculatePermission(null, null, true));
                continue;
            }
            if (metadata.getVisibility() == ObjectVisibility.PUBLIC) {
                ObjectPermission publicPerm = metadata.getPublicPermission() != null
                        ? metadata.getPublicPermission()
                        : ObjectPermission.READ;
                metadata.setPublishUserPermission(PermissionUtil.calculatePermission(publicPerm, currentUserEmail, false));
                continue;
            }

            // Nếu file là PRIVATE -> tìm permission của user trong userFilePermissions
            if (metadata.getUserFilePermissions() != null) {
                UserFilePermission userPermission = metadata.getUserFilePermissions().stream()
                        .filter(p -> currentUserEmail.equals(p.getEmail()))
                        .findFirst()
                        .orElse(null);

                if (userPermission != null && userPermission.getPermissionList() != null && !userPermission.getPermissionList().isEmpty()) {
                    // Lấy quyền cao nhất (MODIFY > COMMENT > READ)
                    ObjectPermission highestPermission = userPermission.getPermissionList().stream()
                            .max(Comparator.comparingInt(Enum::ordinal))
                            .orElse(ObjectPermission.READ);

                    metadata.setPublishUserPermission(PermissionUtil.calculatePermission(highestPermission, currentUserEmail, false));
                } else {
                    // Không có quyền gì
                    metadata.setPublishUserPermission(FileAppPermission.PUBLIC);
                }
            } else {
                // Không có permissions -> không có quyền
                metadata.setPublishUserPermission(FileAppPermission.PUBLIC);
            }
        }

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

    @Override
    public void moveMetadataToTrash(String fileId) {
        MetadataEntity entity = metadataRepo.findById(fileId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));
        String email = auditService.getCurrentUserEmail();
        if (!hasDeletePermissionOnFile(entity, email)) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }
        entity.setIsTrash(true);
        metadataRepo.save(entity);
    }

    @Override
    public void restoreFileFromTrash(String fileId) {
        MetadataEntity entity = metadataRepo.findById(fileId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));
        String email = auditService.getCurrentUserEmail();
        if (!hasEditPermissionOnFile(entity, email)) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }
        entity.setIsTrash(false);
        metadataRepo.save(entity);
    }

    @Override
    public MetadataEntity getFileByToken(String token) {
        MetadataEntity metadata = metadataRepo.findByShareToken(token)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));
        String currentUserEmail = auditService.getCurrentUserEmail();
        String currentUserId = auditService.getCurrentUserId();
        if (!hasScopeOnFile(metadata, currentUserEmail)) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }
        if (metadata.getOwnerId().equals(currentUserId)) {
            metadata.setPublishUserPermission(PermissionUtil.calculatePermission(null, null, true));
        } else
        if (metadata.getVisibility() == ObjectVisibility.PUBLIC) {
            ObjectPermission publicPerm = metadata.getPublicPermission() != null
                    ? metadata.getPublicPermission()
                    : ObjectPermission.READ;
            metadata.setPublishUserPermission(PermissionUtil.calculatePermission(publicPerm, currentUserEmail, false));
        } else if (metadata.getUserFilePermissions() != null) {
            UserFilePermission userPermission = metadata.getUserFilePermissions().stream()
                    .filter(p -> currentUserEmail.equals(p.getEmail()))
                    .findFirst()
                    .orElse(null);

            if (userPermission != null && userPermission.getPermissionList() != null && !userPermission.getPermissionList().isEmpty()) {
                ObjectPermission highestPermission = userPermission.getPermissionList().stream()
                        .max(Comparator.comparingInt(Enum::ordinal))
                        .orElse(ObjectPermission.READ);

                metadata.setPublishUserPermission(PermissionUtil.calculatePermission(highestPermission, currentUserEmail, false));
            } else {
                metadata.setPublishUserPermission(FileAppPermission.PUBLIC);
            }
        } else {
            metadata.setPublishUserPermission(FileAppPermission.PUBLIC);
        }
        return metadata;
    }

    @Override
    public MetadataEntity checkUserOnFile(String shareToken) {
        MetadataEntity metadataEntity = metadataRepo.findByShareToken(shareToken)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));
        if (hasScopeOnFile(metadataEntity, "")) {
            return metadataEntity;
        }
        else return null;
    }

    List<UserFilePermission> mergeUserPermissions(List<UserFilePermission> inputListPermission, List<UserFilePermission> entityListPermission) {
        // Tạo map từ input để dễ tra cứu
        Map<String, List<ObjectPermission>> inputPermissionMap = new HashMap<>();
        inputListPermission.forEach(ufp ->
                inputPermissionMap.put(ufp.getEmail(), ufp.getPermissionList())
        );

        // Lấy danh sách permission hiện tại hoặc tạo mới nếu null
        List<UserFilePermission> currentPermissions = entityListPermission;
        if (currentPermissions == null) {
            currentPermissions = new ArrayList<>();
        }

        // Tạo map từ danh sách hiện tại
        Map<String, UserFilePermission> currentPermissionMap = new HashMap<>();
        currentPermissions.forEach(ufp -> currentPermissionMap.put(ufp.getEmail(), ufp));

        List<String> emailsToRemove = new ArrayList<>();

        // Cập nhật hoặc thêm mới permission cho từng user
        for (Map.Entry<String, List<ObjectPermission>> entry : inputPermissionMap.entrySet()) {
            String email = entry.getKey();
            List<ObjectPermission> newPermissions = entry.getValue();

            if (newPermissions == null || newPermissions.isEmpty()) {
                if (currentPermissionMap.containsKey(email)) {
                    emailsToRemove.add(email);
                }
                continue;
            }

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

        if (!emailsToRemove.isEmpty()) {
            currentPermissions.removeIf(ufp -> emailsToRemove.contains(ufp.getEmail()));
        }

        return currentPermissions;
    }

    Boolean hasEditPermissionOnFile(MetadataEntity metadataEntity, String email) {
        if (email.equals(metadataEntity.getOwnerEmail())) {
            return true;
        }

        if (metadataEntity.getVisibility() == ObjectVisibility.PUBLIC) {
            return metadataEntity.getPublicPermission() == ObjectPermission.MODIFY;
        }

        if (!hasScopeOnFile(metadataEntity, email)) {
            return false;
        }

        List<UserFilePermission> permissions = metadataEntity.getUserFilePermissions();
        if (permissions == null) {
            return false;
        }

        return permissions.stream()
                .filter(ufp -> email.equals(ufp.getEmail()))
                .findFirst()
                .map(ufp -> ufp.getPermissionList() != null &&
                        ufp.getPermissionList().contains(ObjectPermission.MODIFY))
                .orElse(false);
    }

    Boolean hasDeletePermissionOnFile(MetadataEntity metadataEntity, String email) {
        return email.equals(metadataEntity.getOwnerEmail());
    }

    Boolean hasScopeOnFile(MetadataEntity metadataEntity, String email) {
        if (metadataEntity.getVisibility() == ObjectVisibility.PUBLIC) {
            return true;
        }

        if (email.isBlank() || email.isEmpty()) return false;

        if (email.equals(metadataEntity.getOwnerEmail())) {
            return true;
        }

        List<UserFilePermission> permissions = metadataEntity.getUserFilePermissions();
        if (permissions == null || permissions.isEmpty()) {
            return false;
        }

        return permissions.stream()
                .anyMatch(ufp -> email.equals(ufp.getEmail()) &&
                        ufp.getPermissionList() != null &&
                        !ufp.getPermissionList().isEmpty());
    }
}
