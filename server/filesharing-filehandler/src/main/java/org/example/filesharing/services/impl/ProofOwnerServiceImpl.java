package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.AssetEntity;
import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.models.MetadataEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.entity.models.ProofSelectionEntity;
import com.file.service.filesharing.core.enums.ProofSelectionStatus;
import com.file.service.filesharing.core.enums.UploadStatus;
import com.file.service.filesharing.core.enums.AuditAction;
import com.file.service.filesharing.core.enums.AuditTargetType;
import com.file.service.filesharing.core.enums.ProjectStatus;
import com.file.service.filesharing.core.enums.permission.GrantedProjectPermission;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import com.file.service.filesharing.core.exceptions.specException.UserBusinessException;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.auditlog.AuditLogCreateDTO;
import org.example.filesharing.entities.dtos.proof.ProofLinkCreateRequestDto;
import org.example.filesharing.entities.dtos.proof.ProofLinkResponseDto;
import org.example.filesharing.entities.dtos.proof.ProofSelectionDetailDto;
import org.example.filesharing.entities.dtos.proof.ProofSelectionItemDto;
import org.example.filesharing.entities.dtos.proof.ProofSelectionSummaryDto;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.repositories.FolderRepo;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.repositories.ProofSelectionRepo;
import org.example.filesharing.services.AssetAccessService;
import org.example.filesharing.services.AuditLogService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.ProofOwnerService;
import org.example.filesharing.services.baseService.BaseAuditService;
import org.example.filesharing.utils.ProjectPermissionResolver;
import org.example.filesharing.utils.ProofTokenUtils;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ProofOwnerServiceImpl extends BaseAuditService<FolderEntity> implements ProofOwnerService {

    private final FolderRepo folderRepo;
    private final ProjectRepo projectRepo;
    private final AssetAccessService assetAccessService;
    private final AuditService auditService;
    private final AuditLogService auditLogService;
    private final ProofSelectionRepo proofSelectionRepo;
    private final AssetRepo assetRepo;
    private final MetadataRepo metadataRepo;

    @Override
    public ProofLinkResponseDto createOrRefreshLink(String folderId, ProofLinkCreateRequestDto request) {
        FolderEntity folder = getActiveFolderOrThrow(folderId);
        ProjectEntity project = getProjectOrThrow(folder.getProjectId());
        ensureProjectWritable(project);
        assetAccessService.ensureFolderPermission(folder, GrantedProjectPermission.ADD_USER);

        // chi cho tao link khi folder PUBLIC hieu luc, khong tu doi visibility
        if (ProjectPermissionResolver.resolveGuestFolderPermissions(project, folder, folderRepo).isEmpty()) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Folder phai o che do PUBLIC de tao proof link");
        }

        String token = ProofTokenUtils.generateToken();
        while (folderRepo.existsByShareToken(token)) {
            token = ProofTokenUtils.generateToken();
        }

        folder.setShareToken(token);
        folder.setShareExpiry(ProofTokenUtils.resolveExpiry(request != null ? request.getRangeTime() : null, Instant.now()));
        folder.setShareCreatedBy(auditService.getCurrentUserId());
        buildAudit(folder, false);
        FolderEntity saved = folderRepo.save(folder);

        writeAuditLog(saved);
        return new ProofLinkResponseDto(saved.getShareToken(), saved.getShareExpiry());
    }

    @Override
    public ProofLinkResponseDto revokeLink(String folderId) {
        FolderEntity folder = getActiveFolderOrThrow(folderId);
        ProjectEntity project = getProjectOrThrow(folder.getProjectId());
        ensureProjectWritable(project);
        assetAccessService.ensureFolderPermission(folder, GrantedProjectPermission.ADD_USER);

        // save voi field null khong ghi null vao Mongo -> field bi xoa, index unique mot phan luon dung
        folder.setShareToken(null);
        folder.setShareExpiry(null);
        folder.setShareCreatedBy(null);
        buildAudit(folder, false);
        FolderEntity saved = folderRepo.save(folder);

        writeAuditLog(saved);
        return new ProofLinkResponseDto(null, null);
    }

    @Override
    public List<ProofSelectionSummaryDto> getSelections(String folderId) {
        FolderEntity folder = getActiveFolderOrThrow(folderId);
        assetAccessService.ensureFolderPermission(folder, GrantedProjectPermission.READ);

        List<ProofSelectionSummaryDto> result = new ArrayList<>();
        for (ProofSelectionEntity selection : proofSelectionRepo
                .findByFolderIdAndStatusOrderBySubmittedAtDesc(folder.getFolderId(), ProofSelectionStatus.SUBMITTED)) {
            result.add(ProofSelectionSummaryDto.builder()
                    .selectionId(selection.getSelectionId())
                    .guestName(selection.getGuestName())
                    .status(selection.getStatus())
                    .count(selection.getAssetIds() != null ? selection.getAssetIds().size() : 0)
                    .submittedAt(selection.getSubmittedAt())
                    .createdAt(selection.getCreatedAt())
                    .build());
        }
        return result;
    }

    @Override
    public ProofSelectionDetailDto getSelectionDetail(String selectionId) {
        ProofSelectionEntity selection = proofSelectionRepo.findById(selectionId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.NOT_FOUND));
        // quyen dua tren folderId cua chinh ban ghi, khong tin input client
        FolderEntity folder = getActiveFolderOrThrow(selection.getFolderId());
        assetAccessService.ensureFolderPermission(folder, GrantedProjectPermission.READ);

        List<String> assetIds = selection.getAssetIds() != null ? selection.getAssetIds() : List.of();
        Map<String, AssetEntity> assets = new HashMap<>();
        for (AssetEntity asset : assetRepo.findAllById(assetIds)) {
            assets.put(asset.getAssetId(), asset);
        }
        Map<String, MetadataEntity> latest = new HashMap<>();
        for (MetadataEntity version : metadataRepo.findByAssetIdIn(assetIds)) {
            if (version.getStatus() != UploadStatus.COMPLETED || Boolean.TRUE.equals(version.getIsTrash())) {
                continue;
            }
            latest.merge(version.getAssetId(), version, (a, b) ->
                    Comparator.comparing(MetadataEntity::getVersionNumber,
                            Comparator.nullsFirst(Comparator.<Integer>naturalOrder())).compare(a, b) >= 0 ? a : b);
        }

        List<ProofSelectionItemDto> items = new ArrayList<>();
        for (String assetId : assetIds) {
            AssetEntity asset = assets.get(assetId);
            boolean available = asset != null
                    && Boolean.TRUE.equals(asset.getIsActive())
                    && !Boolean.TRUE.equals(asset.getIsTrash())
                    && Objects.equals(asset.getFolderId(), selection.getFolderId());
            MetadataEntity version = latest.get(assetId);
            items.add(ProofSelectionItemDto.builder()
                    .assetId(assetId)
                    .assetName(asset != null ? asset.getAssetName() : null)
                    .thumbnailUrl(available && version != null ? version.getThumbnailUrl() : null)
                    .available(available)
                    .build());
        }

        return ProofSelectionDetailDto.builder()
                .selectionId(selection.getSelectionId())
                .guestName(selection.getGuestName())
                .status(selection.getStatus())
                .note(selection.getNote())
                .submittedAt(selection.getSubmittedAt())
                .items(items)
                .build();
    }

    private FolderEntity getActiveFolderOrThrow(String folderId) {
        FolderEntity folder = folderRepo.findById(folderId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FOLDER_NOT_FOUND));
        if (Boolean.FALSE.equals(folder.getIsActive()) || Boolean.TRUE.equals(folder.getIsTrash())) {
            throw new FileBusinessException(ErrorCode.FOLDER_NOT_FOUND);
        }
        return folder;
    }

    private ProjectEntity getProjectOrThrow(String projectId) {
        ProjectEntity project = projectRepo.findById(projectId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.PROJECT_NOT_FOUND));
        if (Boolean.FALSE.equals(project.getIsActive())) {
            throw new FileBusinessException(ErrorCode.PROJECT_NOT_FOUND);
        }
        return project;
    }

    private void ensureProjectWritable(ProjectEntity project) {
        if (project.getStatus() == ProjectStatus.ARCHIVED || project.getStatus() == ProjectStatus.COMPLETED) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Project is not editable");
        }
    }

    // khong ghi token vao changes
    private void writeAuditLog(FolderEntity folder) {
        AuditLogCreateDTO dto = new AuditLogCreateDTO();
        dto.setAction(AuditAction.SHARE);
        dto.setTargetType(AuditTargetType.FOLDER);
        dto.setTargetId(folder.getFolderId());
        dto.setTargetName(folder.getFolderName());
        auditLogService.createAuditLog(dto);
    }
}
