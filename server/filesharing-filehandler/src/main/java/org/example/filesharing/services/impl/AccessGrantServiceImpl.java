package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.entity.models.access.AccessGrant;
import com.file.service.filesharing.core.entity.models.access.LinkAccess;
import com.file.service.filesharing.core.entity.models.auditlog.AuditChanges;
import com.file.service.filesharing.core.entity.models.project.ProjectCollaborator;
import com.file.service.filesharing.core.enums.AuditAction;
import com.file.service.filesharing.core.enums.AuditTargetType;
import com.file.service.filesharing.core.enums.ProjectStatus;
import com.file.service.filesharing.core.enums.access.AccessRole;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import com.file.service.filesharing.core.exceptions.specException.UserBusinessException;
import com.file.service.filesharing.core.utils.StringUtils;
import com.mongodb.client.result.UpdateResult;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.example.filesharing.entities.dtos.access.AccessSettingsRequestDTO;
import org.example.filesharing.entities.dtos.access.GrantRequestDTO;
import org.example.filesharing.entities.dtos.access.GrantRoleRequestDTO;
import org.example.filesharing.entities.dtos.access.JoinLinkResponseDTO;
import org.example.filesharing.entities.dtos.access.LinkRequestDTO;
import org.example.filesharing.entities.dtos.access.LinkSettingsDTO;
import org.example.filesharing.entities.dtos.auditlog.AuditLogCreateDTO;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.repositories.FolderRepo;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.repositories.UserRepo;
import org.example.filesharing.services.AccessGrantService;
import org.example.filesharing.services.AccessService;
import org.example.filesharing.services.AuditLogService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.ProjectService;
import org.example.filesharing.utils.ProofTokenUtils;
import org.example.filesharing.utils.access.AccessContext;
import org.example.filesharing.utils.access.AccessResolver;
import org.example.filesharing.utils.access.Action;
import org.example.filesharing.utils.access.ResourceRef;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

/**
 * Ghi grant/thanh vien/cai dat bang lenh atomic theo dung path (design 5.2), khong save() ca document.
 * Kiem quyen qua AccessService; xoa thanh vien project tai dung logic cua ProjectServiceImpl (T7, T12).
 */
@Service
@RequiredArgsConstructor
public class AccessGrantServiceImpl implements AccessGrantService {

    private static final String ROLE_REQUIRED_KEY = "error.access.roleRequired";
    private static final String VIEWERS_CAN_DOWNLOAD = "settings.viewersCanDownload";

    private final AccessService accessService;
    private final ProjectService projectService;
    private final ProjectRepo projectRepo;
    private final FolderRepo folderRepo;
    private final UserRepo userRepo;
    private final MongoTemplate mongoTemplate;
    private final AuditService auditService;
    private final AuditLogService auditLogService;

    @Override
    public void addGrant(String type, String id, GrantRequestDTO request) {
        ResourceRef ref = ref(type, id);
        AccessContext caller = accessService.require(ref, Action.INVITE);
        AccessRole role = parseRole(request == null ? null : request.getRole(), ref.type());
        // pham vi cap (folder toi EDITOR, project toi MANAGER) + INVITE >= EDITOR + MANAGER can MANAGE_ACCESS
        // suy ra vai tro cap khong vuot vai tro cua nguoi moi
        if (role.compareTo(AccessRole.EDITOR) > 0 && !AccessResolver.can(caller, Action.MANAGE_ACCESS)) {
            throw new FileBusinessException(ErrorCode.ACTION_NOT_ALLOWED, ROLE_REQUIRED_KEY,
                    Action.MANAGE_ACCESS.minRole().name());
        }
        String target = findUserIdByEmail(request.getEmail());
        String me = auditService.getCurrentUserId();
        Instant now = Instant.now();

        if (ref.type() == ResourceRef.Type.PROJECT) {
            // da la thanh vien thi khong doi gi; khong ghi folder nao
            ProjectCollaborator entry = ProjectCollaborator.builder()
                    .userId(target)
                    .role(role)
                    .addedBy(me)
                    .addedAt(now)
                    .build();
            write(ProjectEntity.class, ref.id(), Criteria.where("collaborators.userId").ne(target),
                    new Update().push("collaborators", entry));
        } else {
            // grant viaLink duoc thay bang grant thuong (design 3.5); 2 lenh vi $pull va $push cung path xung dot
            write(FolderEntity.class, ref.id(), null,
                    new Update().pull("grants", new Document("userId", target).append("viaLink", true)));
            AccessGrant grant = AccessGrant.builder().userId(target).role(role).grantedBy(me).grantedAt(now).build();
            write(FolderEntity.class, ref.id(), Criteria.where("grants.userId").ne(target),
                    new Update().push("grants", grant));
        }
        audit(ref, AuditAction.PERMISSION_CHANGE, "userId", target, "role", role.name());
    }

    @Override
    public void changeRole(String type, String id, String userId, GrantRoleRequestDTO request) {
        ResourceRef ref = ref(type, id);
        AccessContext caller = accessService.require(ref, Action.MANAGE_ACCESS);
        AccessRole role = parseRole(request == null ? null : request.getRole(), ref.type());
        requireNotAbove(caller, ref, userId);

        UpdateResult result;
        if (ref.type() == ResourceRef.Type.PROJECT) {
            result = write(ProjectEntity.class, ref.id(), Criteria.where("collaborators.userId").is(userId),
                    new Update().set("collaborators.$[c].role", role.name())
                            .filterArray(Criteria.where("c.userId").is(userId)));
        } else {
            // chi sua grant truc tiep tai folder nay; vai tro ke thua phai sua tai nguon
            result = write(FolderEntity.class, ref.id(),
                    Criteria.where("grants").elemMatch(Criteria.where("userId").is(userId).and("viaLink").ne(true)),
                    new Update().set("grants.$[g].role", role.name())
                            .filterArray(Criteria.where("g.userId").is(userId).and("g.viaLink").ne(true)));
        }
        if (result.getMatchedCount() == 0) {
            throw new FileBusinessException(ErrorCode.NOT_FOUND, "grant not found");
        }
        audit(ref, AuditAction.PERMISSION_CHANGE, "userId", userId, "role", role.name());
    }

    @Override
    public void removeGrant(String type, String id, String userId) {
        ResourceRef ref = ref(type, id);
        if (StringUtils.isNullOrBlank(userId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "userId is required");
        }
        if (ref.type() == ResourceRef.Type.PROJECT) {
            // MANAGE_ACCESS + khong xoa nguoi cao hon; xoa chinh minh = roi project (owner bi chan)
            // go grant folder truoc, collaborator sau
            projectService.removeCollaboratorFromProject(ref.id(), userId);
            audit(ref, AuditAction.PERMISSION_CHANGE, "removedUserId", userId);
            return;
        }

        if (Objects.equals(userId, auditService.getCurrentUserId())) {
            // tu roi: chi can dang co vai tro tai folder
            accessService.require(ref, Action.VIEW);
        } else {
            requireNotAbove(accessService.require(ref, Action.MANAGE_ACCESS), ref, userId);
        }
        write(FolderEntity.class, ref.id(), null, new Update().pull("grants", new Document("userId", userId)));
        audit(ref, AuditAction.PERMISSION_CHANGE, "removedUserId", userId);
    }

    @Override
    public void updateSettings(String type, String id, AccessSettingsRequestDTO request) {
        ResourceRef ref = ref(type, id);
        accessService.require(ref, Action.MANAGE_SETTINGS);
        Boolean value = request == null ? null : request.getViewersCanDownload();

        Update update = new Update();
        if (value != null) {
            update.set(VIEWERS_CAN_DOWNLOAD, value);
        } else if (ref.type() == ResourceRef.Type.PROJECT) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "viewersCanDownload is required for project");
        } else {
            // folder null = theo cha
            update.unset(VIEWERS_CAN_DOWNLOAD);
        }
        write(ref.type() == ResourceRef.Type.PROJECT ? ProjectEntity.class : FolderEntity.class, ref.id(), null, update);
        audit(ref, AuditAction.PERMISSION_CHANGE, "viewersCanDownload", value);
    }

    @Override
    public LinkSettingsDTO updateLink(String folderId, LinkRequestDTO request) {
        ResourceRef ref = ref("folder", folderId);
        accessService.require(ref, Action.MANAGE_ACCESS);
        FolderEntity folder = folderRepo.findById(ref.id())
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FOLDER_NOT_FOUND));

        if (request == null || !Boolean.TRUE.equals(request.getEnabled())) {
            // tat link: go grant viaLink trong cung lenh
            write(FolderEntity.class, ref.id(), null, new Update()
                    .unset("link")
                    .pull("grants", new Document("viaLink", true)));
            audit(ref, AuditAction.SHARE, "linkEnabled", false);
            return LinkSettingsDTO.builder().enabled(false).build();
        }

        // link chi cap VIEWER/COMMENTER; null = chi dung cho proof
        AccessRole role = StringUtils.isNullOrBlank(request.getRole())
                ? null : parseRole(request.getRole(), ResourceRef.Type.FOLDER);
        if (role != null && role.compareTo(AccessRole.COMMENTER) > 0) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "link chi cap VIEWER hoac COMMENTER");
        }

        LinkAccess old = folder.getLink();
        boolean newToken = old == null || StringUtils.isNullOrBlank(old.getToken())
                || Boolean.TRUE.equals(request.getRegenerate());
        Instant now = Instant.now();
        String me = auditService.getCurrentUserId();
        // expiry null = giu han hien tai
        Instant expiresAt = request.getExpiry() != null
                ? ProofTokenUtils.resolveExpiry(request.getExpiry(), now)
                : old != null ? old.getExpiresAt() : null;
        LinkAccess link = LinkAccess.builder()
                .token(newToken ? ProofTokenUtils.generateToken() : old.getToken())
                .role(role)
                .allowDownload(Boolean.TRUE.equals(request.getAllowDownload()))
                .allowProofSelection(Boolean.TRUE.equals(request.getAllowProofSelection()))
                .expiresAt(expiresAt)
                .createdBy(newToken ? me : old.getCreatedBy())
                .createdAt(newToken ? now : old.getCreatedAt())
                .build();

        Update update = new Update().set("link", link);
        if (newToken) {
            // doi token: nguoi vao qua link cu mat quyen ngay, cung 1 lenh
            update.pull("grants", new Document("viaLink", true));
        }
        write(FolderEntity.class, ref.id(), null, update);
        audit(ref, AuditAction.SHARE, "linkEnabled", true, "role", role == null ? null : role.name(),
                "allowDownload", link.getAllowDownload(), "allowProofSelection", link.getAllowProofSelection(),
                "regenerated", newToken);

        return LinkSettingsDTO.builder()
                .enabled(true)
                .token(link.getToken())
                .role(role)
                .allowDownload(link.getAllowDownload())
                .allowProofSelection(link.getAllowProofSelection())
                .expiresAt(expiresAt)
                .build();
    }

    @Override
    public JoinLinkResponseDTO joinLink(String token) {
        // link khong dung duoc tra cung PROOF_LINK_INVALID nhu luong proof, rieng het han tra LINK_EXPIRED
        FolderEntity folder = StringUtils.isNullOrBlank(token) ? null : folderRepo.findByLinkToken(token).orElse(null);
        if (folder == null || folder.getLink() == null
                || Boolean.FALSE.equals(folder.getIsActive()) || Boolean.TRUE.equals(folder.getIsTrash())) {
            throw new FileBusinessException(ErrorCode.PROOF_LINK_INVALID);
        }
        LinkAccess link = folder.getLink();
        if (link.getExpiresAt() != null && !Instant.now().isBefore(link.getExpiresAt())) {
            throw new FileBusinessException(ErrorCode.LINK_EXPIRED);
        }
        if (link.getRole() == null) {
            throw new FileBusinessException(ErrorCode.PROOF_LINK_INVALID);
        }

        AccessContext ctx = accessService.resolve(ResourceRef.folder(folder.getFolderId()));
        if (ctx.trashed() || ctx.projectStatus() == ProjectStatus.ARCHIVED) {
            throw new FileBusinessException(ErrorCode.PROOF_LINK_INVALID);
        }
        // da co vai tro so huu thi khong ghi; mo link khong bien user thanh thanh vien project
        if (ctx.own() == null) {
            String me = auditService.getCurrentUserId();
            AccessGrant grant = AccessGrant.builder()
                    .userId(me)
                    .viaLink(true)
                    .grantedBy(link.getCreatedBy())
                    .grantedAt(Instant.now())
                    .build();
            // dieu kien link.token: link bi doi/tat giua chung thi khong ghi
            mongoTemplate.updateFirst(
                    Query.query(Criteria.where("_id").is(folder.getFolderId())
                            .and("grants.userId").ne(me)
                            .and("link.token").is(token)),
                    new Update().push("grants", grant),
                    FolderEntity.class);
        }
        return new JoinLinkResponseDTO(folder.getProjectId(), folder.getFolderId());
    }

    // ---------- noi bo ----------

    private static ResourceRef ref(String type, String id) {
        if (StringUtils.isNullOrBlank(id)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "id is required");
        }
        if ("project".equals(type)) {
            return ResourceRef.project(id.trim());
        }
        if ("folder".equals(type)) {
            return ResourceRef.folder(id.trim());
        }
        throw new UserBusinessException(ErrorCode.BAD_REQUEST, "type must be project or folder");
    }

    // gia tri ngoai thang (ke ca RESTRICTED) hoac vuot pham vi cap -> BAD_REQUEST; OWNER -> ACTION_NOT_ALLOWED
    // dung chung voi ProjectServiceImpl.buildCollaborators (tao project kem thanh vien)
    static AccessRole parseRole(String value, ResourceRef.Type type) {
        if (StringUtils.isNullOrBlank(value)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "role is required");
        }
        AccessRole role;
        try {
            role = AccessRole.valueOf(value.trim());
        } catch (IllegalArgumentException e) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "role khong hop le");
        }
        if (role == AccessRole.OWNER) {
            throw new FileBusinessException(ErrorCode.ACTION_NOT_ALLOWED);
        }
        AccessRole max = type == ResourceRef.Type.PROJECT ? AccessRole.MANAGER : AccessRole.EDITOR;
        if (role.compareTo(max) > 0) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "role vuot pham vi cap cua " + type.name().toLowerCase());
        }
        return role;
    }

    // cung nghia ProjectServiceImpl.requireNotAbove, them luat khong sua owner
    private void requireNotAbove(AccessContext caller, ResourceRef ref, String targetUserId) {
        AccessRole target = accessService.resolve(ref, targetUserId).own();
        if (target == AccessRole.OWNER
                || (target != null && caller.own() != null && target.compareTo(caller.own()) > 0)) {
            throw new FileBusinessException(ErrorCode.ACTION_NOT_ALLOWED);
        }
    }

    private String findUserIdByEmail(String email) {
        if (StringUtils.isNullOrBlank(email)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "email is required");
        }
        // email chua co tai khoan tra 400 toi P7
        return userRepo.findByEmail(email.trim())
                .map(UserEntity::getUserId)
                .orElseThrow(() -> new UserBusinessException(ErrorCode.BAD_REQUEST, "user not found by email"));
    }

    private UpdateResult write(Class<?> entityClass, String id, Criteria extra, Update update) {
        Query query = Query.query(Criteria.where("_id").is(id));
        if (extra != null) {
            query.addCriteria(extra);
        }
        update.set("updateBy", auditService.getCurrentUserId())
                .set("updateByEmail", auditService.getCurrentUserEmail())
                .set("updatedAt", Instant.now());
        return mongoTemplate.updateFirst(query, update, entityClass);
    }

    // keyValues: cap key, value; khong ghi token
    private void audit(ResourceRef ref, AuditAction action, Object... keyValues) {
        Map<String, Object> after = new HashMap<>();
        for (int i = 0; i + 1 < keyValues.length; i += 2) {
            after.put((String) keyValues[i], keyValues[i + 1]);
        }
        boolean project = ref.type() == ResourceRef.Type.PROJECT;
        AuditLogCreateDTO dto = new AuditLogCreateDTO();
        dto.setAction(action);
        dto.setTargetType(project ? AuditTargetType.PROJECT : AuditTargetType.FOLDER);
        dto.setTargetId(ref.id());
        dto.setTargetName(project
                ? projectRepo.findById(ref.id()).map(ProjectEntity::getProjectName).orElse(null)
                : folderRepo.findById(ref.id()).map(FolderEntity::getFolderName).orElse(null));
        // AuditLogServiceImpl bat buoc co ca before va after voi PERMISSION_CHANGE
        dto.setChanges(AuditChanges.builder().before(new HashMap<>()).after(after).build());
        auditLogService.createAuditLog(dto);
    }
}
