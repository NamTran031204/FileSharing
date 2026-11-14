package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.entity.models.access.AccessGrant;
import com.file.service.filesharing.core.entity.models.access.LinkAccess;
import com.file.service.filesharing.core.entity.models.project.ProjectCollaborator;
import com.file.service.filesharing.core.enums.ProjectStatus;
import com.file.service.filesharing.core.enums.access.AccessRole;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import com.file.service.filesharing.core.exceptions.specException.UserBusinessException;
import com.file.service.filesharing.core.utils.StringUtils;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.access.LinkSettingsDTO;
import org.example.filesharing.entities.dtos.access.MentionUserDTO;
import org.example.filesharing.entities.dtos.access.PeopleResponseDTO;
import org.example.filesharing.entities.dtos.access.SharedFolderDTO;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.repositories.UserRepo;
import org.example.filesharing.services.AccessQueryService;
import org.example.filesharing.services.AccessService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.utils.access.AccessContext;
import org.example.filesharing.utils.access.AccessContext.SourceType;
import org.example.filesharing.utils.access.AccessResolver;
import org.example.filesharing.utils.access.Action;
import org.example.filesharing.utils.access.ResourceRef;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Doc quyen theo mo hinh moi (design 3.7, Q7). Kiem quyen qua AccessService, chain lay qua AccessService.chain
 * de dung cung cach kiem chain lech. VIEW_PEOPLE chi tinh ownRole nen nguoi chi vao qua link bi tu choi.
 */
@Service
@RequiredArgsConstructor
public class AccessQueryServiceImpl implements AccessQueryService {

    private final AccessService accessService;
    private final ProjectRepo projectRepo;
    private final UserRepo userRepo;
    private final MongoTemplate mongoTemplate;
    private final AuditService auditService;

    @Override
    public PeopleResponseDTO getPeople(String type, String id) {
        ResourceRef ref = ref(type, id);
        AccessContext caller = accessService.require(ref, Action.VIEW_PEOPLE);
        List<FolderEntity> chain = chainOf(ref);
        ProjectEntity project = projectOf(ref, chain);

        List<Draft> projectLayer = projectLayer(project);
        if (ref.type() == ResourceRef.Type.PROJECT) {
            return PeopleResponseDTO.builder()
                    .direct(toPeople(projectLayer))
                    .inherited(List.of())
                    .viaLink(List.of())
                    .build();
        }

        FolderEntity target = chain.get(chain.size() - 1);
        Instant now = Instant.now();
        List<Draft> direct = new ArrayList<>();
        List<Draft> inherited = new ArrayList<>();
        List<Draft> viaLink = new ArrayList<>();
        // nguoi khong la thanh vien project khong thay lop ke thua tu project (Q7)
        boolean member = caller.sources().stream()
                .anyMatch(s -> s.type() == SourceType.OWNER || s.type() == SourceType.PROJECT);
        if (member) {
            inherited.addAll(projectLayer);
        }
        for (FolderEntity f : chain) {
            boolean isTarget = f == target;
            for (AccessGrant g : grants(f)) {
                if (!Boolean.TRUE.equals(g.getViaLink())) {
                    if (g.getRole() != null) {
                        (isTarget ? direct : inherited).add(new Draft(g.getUserId(), g.getRole(), SourceType.FOLDER, f));
                    }
                } else if (AccessResolver.linkUsable(f.getLink(), now)) {
                    viaLink.add(new Draft(g.getUserId(), f.getLink().getRole(), SourceType.LINK, f));
                }
            }
        }

        return PeopleResponseDTO.builder()
                .link(linkLayer(target.getLink(), AccessResolver.can(caller, Action.MANAGE_ACCESS)))
                .direct(toPeople(direct))
                .inherited(toPeople(inherited))
                .viaLink(toPeople(viaLink))
                .build();
    }

    @Override
    public List<MentionUserDTO> getUserMention(String type, String id) {
        ResourceRef ref = ref(type, id);
        accessService.require(ref, Action.VIEW_PEOPLE);
        List<FolderEntity> chain = chainOf(ref);
        ProjectEntity project = projectOf(ref, chain);

        // chi nguoi co ownRole tai tai nguyen nay: owner, thanh vien, grant thuong tren chain (khong anh em/con)
        Set<String> ids = new LinkedHashSet<>();
        projectLayer(project).forEach(d -> ids.add(d.userId()));
        for (FolderEntity f : chain) {
            for (AccessGrant g : grants(f)) {
                if (!Boolean.TRUE.equals(g.getViaLink()) && g.getRole() != null) {
                    ids.add(g.getUserId());
                }
            }
        }

        Map<String, UserEntity> users = usersById(ids);
        return ids.stream()
                .map(users::get)
                .filter(Objects::nonNull)
                .map(u -> new MentionUserDTO(u.getUserId(), u.getPublicUserName(), u.getEmail()))
                .toList();
    }

    @Override
    public List<SharedFolderDTO> getSharedWithMe() {
        String me = auditService.getCurrentUserId();
        Instant now = Instant.now();
        Query query = Query.query(Criteria.where("grants.userId").is(me)
                .and("isActive").is(true)
                .and("isTrash").ne(true));
        query.fields().include("folderName", "projectId", "grants", "link");
        List<FolderEntity> folders = mongoTemplate.find(query, FolderEntity.class);
        if (folders.isEmpty()) {
            return List.of();
        }

        Set<String> projectIds = folders.stream().map(FolderEntity::getProjectId).collect(Collectors.toSet());
        Map<String, ProjectEntity> projects = new HashMap<>();
        projectRepo.findAllById(projectIds).forEach(p -> projects.put(p.getProjectId(), p));

        List<SharedFolderDTO> result = new ArrayList<>();
        for (FolderEntity f : folders) {
            ProjectEntity p = projects.get(f.getProjectId());
            // bo project da xoa, ARCHIVED, hoac minh da la owner/thanh vien
            if (p == null || Boolean.FALSE.equals(p.getIsActive()) || p.getStatus() == ProjectStatus.ARCHIVED
                    || AccessResolver.resolve(p, List.of(), me, now).own() != null) {
                continue;
            }
            SharedFolderDTO item = sharedItem(f, p, me, now);
            if (item != null) {
                result.add(item);
            }
        }
        result.sort(Comparator.comparing(SharedFolderDTO::getGrantedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        return result;
    }

    // ---------- noi bo ----------

    private record Draft(String userId, AccessRole role, SourceType source, FolderEntity folder) {
    }

    // grant thuong uu tien hon viaLink; viaLink chi tinh khi link con han va co vai tro
    private static SharedFolderDTO sharedItem(FolderEntity f, ProjectEntity p, String me, Instant now) {
        AccessGrant chosen = null;
        AccessRole role = null;
        for (AccessGrant g : grants(f)) {
            if (!me.equals(g.getUserId())) {
                continue;
            }
            if (!Boolean.TRUE.equals(g.getViaLink()) && g.getRole() != null) {
                chosen = g;
                role = g.getRole();
                break;
            }
            if (Boolean.TRUE.equals(g.getViaLink()) && AccessResolver.linkUsable(f.getLink(), now) && chosen == null) {
                chosen = g;
                role = f.getLink().getRole();
            }
        }
        if (chosen == null) {
            return null;
        }
        return SharedFolderDTO.builder()
                .folderId(f.getFolderId())
                .folderName(f.getFolderName())
                .projectId(p.getProjectId())
                .projectName(p.getProjectName())
                .role(role)
                .viaLink(Boolean.TRUE.equals(chosen.getViaLink()))
                .grantedAt(chosen.getGrantedAt())
                .build();
    }

    // owner va thanh vien co vai tro (collaborator role null khong co quyen)
    private static List<Draft> projectLayer(ProjectEntity project) {
        List<Draft> drafts = new ArrayList<>();
        if (StringUtils.isNotNullOrBlank(project.getOwnerId())) {
            drafts.add(new Draft(project.getOwnerId(), AccessRole.OWNER, SourceType.OWNER, null));
        }
        if (project.getCollaborators() != null) {
            for (ProjectCollaborator c : project.getCollaborators()) {
                if (c.getRole() != null && !Objects.equals(c.getUserId(), project.getOwnerId())) {
                    drafts.add(new Draft(c.getUserId(), c.getRole(), SourceType.PROJECT, null));
                }
            }
        }
        return drafts;
    }

    // token chi tra cho nguoi co MANAGE_ACCESS
    private static LinkSettingsDTO linkLayer(LinkAccess link, boolean canManage) {
        if (link == null) {
            return null;
        }
        return LinkSettingsDTO.builder()
                .enabled(true)
                .token(canManage ? link.getToken() : null)
                .role(link.getRole())
                .allowDownload(link.getAllowDownload())
                .allowProofSelection(link.getAllowProofSelection())
                .expiresAt(link.getExpiresAt())
                .build();
    }

    private List<PeopleResponseDTO.Person> toPeople(List<Draft> drafts) {
        Map<String, UserEntity> users = usersById(drafts.stream().map(Draft::userId).collect(Collectors.toSet()));
        return drafts.stream()
                .filter(d -> users.containsKey(d.userId()))
                .map(d -> {
                    UserEntity u = users.get(d.userId());
                    return PeopleResponseDTO.Person.builder()
                            .userId(u.getUserId())
                            .publicUserName(u.getPublicUserName())
                            .email(u.getEmail())
                            .role(d.role())
                            .source(d.source())
                            .folderId(d.folder() == null ? null : d.folder().getFolderId())
                            .folderName(d.folder() == null ? null : d.folder().getFolderName())
                            .build();
                })
                .toList();
    }

    private Map<String, UserEntity> usersById(Set<String> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return userRepo.findAllById(ids).stream()
                .collect(Collectors.toMap(UserEntity::getUserId, Function.identity(), (a, b) -> a));
    }

    private List<FolderEntity> chainOf(ResourceRef ref) {
        return ref.type() == ResourceRef.Type.FOLDER ? accessService.chain(ref.id()) : List.of();
    }

    private ProjectEntity projectOf(ResourceRef ref, List<FolderEntity> chain) {
        String projectId = ref.type() == ResourceRef.Type.PROJECT ? ref.id() : chain.get(chain.size() - 1).getProjectId();
        return projectRepo.findById(projectId).orElseThrow(() -> new FileBusinessException(ErrorCode.PROJECT_NOT_FOUND));
    }

    private static List<AccessGrant> grants(FolderEntity f) {
        return f.getGrants() == null ? List.of() : f.getGrants().stream().filter(g -> g.getUserId() != null).toList();
    }

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
}
