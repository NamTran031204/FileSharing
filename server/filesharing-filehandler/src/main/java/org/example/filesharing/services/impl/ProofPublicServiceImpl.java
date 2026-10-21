package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.PageResult;
import com.file.service.filesharing.core.entity.models.AssetEntity;
import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.models.MetadataEntity;
import com.file.service.filesharing.core.entity.models.NotificationEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.entity.models.ProofSelectionEntity;
import com.file.service.filesharing.core.entity.models.notification.NotificationContext;
import com.file.service.filesharing.core.entity.models.notification.NotificationDelivery;
import com.file.service.filesharing.core.enums.DeliveryStatus;
import com.file.service.filesharing.core.enums.MediaType;
import com.file.service.filesharing.core.enums.NotificationType;
import com.file.service.filesharing.core.enums.ProcessingStatus;
import com.file.service.filesharing.core.enums.ProjectStatus;
import com.file.service.filesharing.core.enums.ProofSelectionStatus;
import com.file.service.filesharing.core.enums.UploadStatus;
import com.file.service.filesharing.core.enums.permission.GrantedProjectPermission;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.dtos.proof.ProofAssetItemDto;
import org.example.filesharing.entities.dtos.proof.ProofLandingResponseDto;
import org.example.filesharing.entities.dtos.proof.ProofSessionCreateRequestDto;
import org.example.filesharing.entities.dtos.proof.ProofSessionResponseDto;
import org.example.filesharing.entities.dtos.proof.ProofSubmitRequestDto;
import org.example.filesharing.entities.dtos.proof.ProofSubmitResponseDto;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.repositories.FolderRepo;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.repositories.NotificationRepo;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.repositories.ProofSelectionRepo;
import org.example.filesharing.repositories.UserRepo;
import org.example.filesharing.services.MinIoService;
import org.example.filesharing.services.ProofPublicService;
import org.example.filesharing.utils.ProjectPermissionResolver;
import org.example.filesharing.utils.ProofTokenUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * Luong cho khach khong tai khoan. Khong extends BaseAuditService vi buildAudit can user dang nhap.
 * Moi loi tra FileBusinessException, khong dung HTTP 401.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProofPublicServiceImpl implements ProofPublicService {

    private static final int MAX_NAME_LENGTH = 100;
    private static final int MAX_NOTE_LENGTH = 1000;
    private static final int MAX_SUBMIT_ASSETS = 5000;
    private static final int MAX_PAGE_SIZE = 100;
    private static final int PREVIEW_URL_SECONDS = 3600;

    private final FolderRepo folderRepo;
    private final ProjectRepo projectRepo;
    private final AssetRepo assetRepo;
    private final MetadataRepo metadataRepo;
    private final ProofSelectionRepo proofSelectionRepo;
    private final NotificationRepo notificationRepo;
    private final UserRepo userRepo;
    private final MongoTemplate mongoTemplate;
    private final MinIoService minIoService;

    @Value("${minio.buckets.image-preview}")
    private String imagePreviewBucket;

    @Override
    public ProofLandingResponseDto getLanding(String shareToken) {
        FolderEntity folder = resolveLink(shareToken);
        return new ProofLandingResponseDto(
                folder.getFolderName(),
                mongoTemplate.count(buildImageQuery(folder.getFolderId()), AssetEntity.class),
                folder.getShareExpiry());
    }

    @Override
    public ProofSessionResponseDto createSession(String shareToken, ProofSessionCreateRequestDto request) {
        FolderEntity folder = resolveLink(shareToken);

        String name = request != null && request.getGuestName() != null ? request.getGuestName().trim() : "";
        if (name.isEmpty() || name.length() > MAX_NAME_LENGTH) {
            throw new FileBusinessException(ErrorCode.BAD_REQUEST, "Ten khach phai tu 1 den 100 ky tu");
        }

        String guestKey = ProofTokenUtils.generateToken();
        Instant now = Instant.now();
        ProofSelectionEntity selection = ProofSelectionEntity.builder()
                .projectId(folder.getProjectId())
                .folderId(folder.getFolderId())
                .guestName(name)
                .guestKeyHash(ProofTokenUtils.sha256Hex(guestKey))
                .assetIds(new ArrayList<>())
                .status(ProofSelectionStatus.DRAFT)
                .build();
        selection.setIsActive(true);
        selection.setIsTrash(false);
        selection.setCreatedBy("guest:" + name);
        selection.setCreatedAt(now);
        selection.setUpdatedAt(now);
        proofSelectionRepo.save(selection);

        return new ProofSessionResponseDto(guestKey, name);
    }

    @Override
    public PageResult<ProofAssetItemDto> getAssets(String shareToken, String guestKey, int page, int size) {
        FolderEntity folder = resolveLink(shareToken);
        resolveSession(folder, guestKey);

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);

        Query countQuery = buildImageQuery(folder.getFolderId());
        long total = mongoTemplate.count(countQuery, AssetEntity.class);

        Query query = buildImageQuery(folder.getFolderId());
        query.with(Sort.by(Sort.Direction.ASC, "assetName"));
        query.skip((long) safePage * safeSize).limit(safeSize);
        List<AssetEntity> assets = mongoTemplate.find(query, AssetEntity.class);

        List<String> assetIds = assets.stream().map(AssetEntity::getAssetId).toList();
        Map<String, MetadataEntity> latestByAsset = new HashMap<>();
        for (MetadataEntity version : metadataRepo.findByAssetIdIn(assetIds)) {
            if (version.getStatus() != UploadStatus.COMPLETED
                    || Boolean.TRUE.equals(version.getIsTrash())
                    || version.getProcessingStatus() != ProcessingStatus.READY) {
                continue;
            }
            latestByAsset.merge(version.getAssetId(), version, (a, b) ->
                    Comparator.comparing(MetadataEntity::getVersionNumber,
                            Comparator.nullsFirst(Comparator.<Integer>naturalOrder())).compare(a, b) >= 0 ? a : b);
        }

        // ponytail: asset chua READY bi bo sau khi phan trang nen trang co the ngan hon size, totalCount tinh tren asset
        List<ProofAssetItemDto> items = new ArrayList<>();
        for (AssetEntity asset : assets) {
            MetadataEntity version = latestByAsset.get(asset.getAssetId());
            if (version == null) {
                continue;
            }
            items.add(ProofAssetItemDto.builder()
                    .assetId(asset.getAssetId())
                    .assetName(asset.getAssetName())
                    .thumbnailUrl(version.getThumbnailUrl())
                    .previewUrl(buildPreviewUrl(version))
                    .width(version.getMediaInfo() != null ? version.getMediaInfo().getWidth() : null)
                    .height(version.getMediaInfo() != null ? version.getMediaInfo().getHeight() : null)
                    .build());
        }

        return PageResult.<ProofAssetItemDto>builder().totalCount(total).data(items).build();
    }

    @Override
    public ProofSubmitResponseDto submit(String shareToken, String guestKey, ProofSubmitRequestDto request) {
        FolderEntity folder = resolveLink(shareToken);
        ProofSelectionEntity session = resolveSession(folder, guestKey);

        if (session.getStatus() == ProofSelectionStatus.SUBMITTED) {
            throw new FileBusinessException(ErrorCode.PROOF_ALREADY_SUBMITTED);
        }

        List<String> assetIds = request != null && request.getAssetIds() != null
                ? new ArrayList<>(new LinkedHashSet<>(request.getAssetIds()))
                : List.of();
        if (assetIds.isEmpty() || assetIds.size() > MAX_SUBMIT_ASSETS) {
            throw new FileBusinessException(ErrorCode.BAD_REQUEST, "Danh sach anh phai tu 1 den 5000");
        }
        String note = request.getNote() != null ? request.getNote().trim() : null;
        if (note != null && note.length() > MAX_NOTE_LENGTH) {
            throw new FileBusinessException(ErrorCode.BAD_REQUEST, "Loi nhan toi da 1000 ky tu");
        }
        if (note != null && note.isEmpty()) {
            note = null;
        }

        // moi assetId phai thuoc dung folder cua link va con hieu luc (chong IDOR)
        List<AssetEntity> found = assetRepo.findAllById(assetIds);
        if (found.size() != assetIds.size()) {
            throw new FileBusinessException(ErrorCode.PROOF_ASSET_NOT_IN_FOLDER);
        }
        for (AssetEntity asset : found) {
            if (!Objects.equals(asset.getFolderId(), folder.getFolderId())
                    || !Boolean.TRUE.equals(asset.getIsActive())
                    || Boolean.TRUE.equals(asset.getIsTrash())
                    || asset.getMediaType() != MediaType.IMAGE) {
                throw new FileBusinessException(ErrorCode.PROOF_ASSET_NOT_IN_FOLDER);
            }
        }

        // chuyen DRAFT -> SUBMITTED nguyen tu, hai submit dong thoi chi mot cai thanh cong
        Instant now = Instant.now();
        Query query = new Query(Criteria.where("_id").is(session.getSelectionId())
                .and("status").is(ProofSelectionStatus.DRAFT));
        Update update = new Update()
                .set("status", ProofSelectionStatus.SUBMITTED)
                .set("assetIds", assetIds)
                .set("submittedAt", now)
                .set("updatedAt", now);
        if (note != null) {
            update.set("note", note);
        }
        ProofSelectionEntity updated = mongoTemplate.findAndModify(
                query, update, FindAndModifyOptions.options().returnNew(true), ProofSelectionEntity.class);
        if (updated == null) {
            throw new FileBusinessException(ErrorCode.PROOF_ALREADY_SUBMITTED);
        }

        notifyOwner(folder, updated);
        return new ProofSubmitResponseDto(updated.getSelectionId(), assetIds.size(), now);
    }

    // ---- link / session ----

    // moi truong hop khong hop le (ke ca folder het PUBLIC) tra cung PROOF_LINK_INVALID de khong lo thong tin
    private FolderEntity resolveLink(String shareToken) {
        if (shareToken == null || shareToken.isBlank()) {
            throw new FileBusinessException(ErrorCode.PROOF_LINK_INVALID);
        }
        FolderEntity folder = folderRepo.findByShareToken(shareToken)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.PROOF_LINK_INVALID));
        if (Boolean.FALSE.equals(folder.getIsActive()) || Boolean.TRUE.equals(folder.getIsTrash())) {
            throw new FileBusinessException(ErrorCode.PROOF_LINK_INVALID);
        }

        Optional<ProjectEntity> projectOpt = projectRepo.findById(folder.getProjectId());
        if (projectOpt.isEmpty()
                || Boolean.FALSE.equals(projectOpt.get().getIsActive())
                || projectOpt.get().getStatus() == ProjectStatus.ARCHIVED) {
            throw new FileBusinessException(ErrorCode.PROOF_LINK_INVALID);
        }

        List<GrantedProjectPermission> permissions =
                ProjectPermissionResolver.resolveGuestFolderPermissions(projectOpt.get(), folder, folderRepo);
        if (!permissions.contains(GrantedProjectPermission.READ)
                || !permissions.contains(GrantedProjectPermission.SELECT_AND_SUBMIT)) {
            throw new FileBusinessException(ErrorCode.PROOF_LINK_INVALID);
        }

        if (folder.getShareExpiry() != null && !folder.getShareExpiry().isAfter(Instant.now())) {
            throw new FileBusinessException(ErrorCode.PROOF_LINK_EXPIRED);
        }
        return folder;
    }

    private ProofSelectionEntity resolveSession(FolderEntity folder, String guestKey) {
        if (guestKey == null || guestKey.isBlank()) {
            throw new FileBusinessException(ErrorCode.PROOF_SESSION_INVALID);
        }
        ProofSelectionEntity session = proofSelectionRepo.findByGuestKeyHash(ProofTokenUtils.sha256Hex(guestKey))
                .orElseThrow(() -> new FileBusinessException(ErrorCode.PROOF_SESSION_INVALID));
        if (!Objects.equals(session.getFolderId(), folder.getFolderId())) {
            throw new FileBusinessException(ErrorCode.PROOF_SESSION_INVALID);
        }
        return session;
    }

    // ---- helpers ----

    // chi anh truc tiep trong folder, khong sub-folder, khong trash
    private Query buildImageQuery(String folderId) {
        return new Query(Criteria.where("folderId").is(folderId)
                .and("isActive").is(true)
                .and("isTrash").ne(true)
                .and("mediaType").is(MediaType.IMAGE));
    }

    // preview la presigned GET ngan han, khong bao gio tra URL file goc
    private String buildPreviewUrl(MetadataEntity version) {
        if (version.getObjectName() == null) {
            return null;
        }
        try {
            return minIoService.generatePresignedUrl(imagePreviewBucket, version.getObjectName(), PREVIEW_URL_SECONDS);
        } catch (Exception e) {
            log.error("khong tao duoc preview url cho asset {}: {}", version.getAssetId(), e.getMessage());
            return null;
        }
    }

    // loi notification khong lam hong submit
    private void notifyOwner(FolderEntity folder, ProofSelectionEntity selection) {
        try {
            String ownerId = folder.getShareCreatedBy();
            if (ownerId == null || userRepo.findById(ownerId).isEmpty()) {
                return;
            }
            int count = selection.getAssetIds() != null ? selection.getAssetIds().size() : 0;
            NotificationEntity notification = NotificationEntity.builder()
                    .userId(ownerId)
                    .type(NotificationType.PROOF_SUBMITTED)
                    .title("Khách đã gửi lựa chọn ảnh")
                    .message(selection.getGuestName() + " đã chọn " + count + " ảnh trong folder " + folder.getFolderName())
                    .link("/projects/" + folder.getProjectId() + "?folderId=" + folder.getFolderId())
                    .context(NotificationContext.builder().actorName(selection.getGuestName()).build())
                    .isRead(false)
                    .deliveryStatus(NotificationDelivery.builder()
                            .inApp(DeliveryStatus.PENDING)
                            .email(DeliveryStatus.PENDING)
                            .build())
                    .build();
            Instant now = Instant.now();
            notification.setIsActive(true);
            notification.setIsTrash(false);
            notification.setCreatedBy("guest:" + selection.getGuestName());
            notification.setCreatedAt(now);
            notification.setUpdatedAt(now);
            notificationRepo.save(notification);
        } catch (Exception e) {
            log.error("khong tao duoc notification proof cho folder {}: {}", folder.getFolderId(), e.getMessage());
        }
    }
}
