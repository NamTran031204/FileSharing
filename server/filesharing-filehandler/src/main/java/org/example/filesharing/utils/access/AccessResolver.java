package org.example.filesharing.utils.access;

import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.entity.models.access.AccessGrant;
import com.file.service.filesharing.core.entity.models.access.LinkAccess;
import com.file.service.filesharing.core.entity.models.project.ProjectCollaborator;
import com.file.service.filesharing.core.enums.ProjectStatus;
import com.file.service.filesharing.core.enums.access.AccessRole;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Predicate;

/**
 * Ham thuan tinh quyen (design 4.1), khong phu thuoc Spring/Mongo, khong co admin bypass.
 * Vai tro null nghia la khong co vai tro nao.
 */
public final class AccessResolver {

    private AccessResolver() {
    }

    /** chain: folder to tien -> folder dich, da validate; rong neu tai nguyen o goc project. */
    public static AccessContext resolve(ProjectEntity project, List<FolderEntity> chain, String userId, Instant now) {
        return resolve(project, chain, userId, now, false);
    }

    /** targetTrashed: tai nguyen dich (vd asset) nam trong thung rac; folder trong chain tu xet isTrash. */
    public static AccessContext resolve(ProjectEntity project, List<FolderEntity> chain, String userId, Instant now,
                                        boolean targetTrashed) {
        List<FolderEntity> nodes = chain == null ? List.of() : chain;
        boolean trashed = targetTrashed || nodes.stream().anyMatch(AccessResolver::isTrash);
        List<AccessContext.Source> sources = new ArrayList<>();
        AccessRole own = projectRole(project, userId, sources);
        AccessRole link = null;
        FolderEntity linkNode = null;

        if (trashed) {
            // thung rac chi hien voi nguoi co TRASH tai project, bo qua grant folder va link
            if (!atLeast(own, Action.TRASH.minRole())) {
                own = null;
                sources.clear();
            }
        } else if (userId != null) {
            for (FolderEntity f : nodes) {
                for (AccessGrant g : grantsOf(f, userId)) {
                    if (!Boolean.TRUE.equals(g.getViaLink())) {
                        if (g.getRole() == null) {
                            continue;
                        }
                        own = max(own, g.getRole());
                        sources.add(new AccessContext.Source(AccessContext.SourceType.FOLDER, g.getRole(), f.getFolderId()));
                    } else if (linkUsable(f.getLink(), now)) {
                        AccessRole linkRole = f.getLink().getRole();
                        if (link == null || linkRole.compareTo(link) > 0) {
                            link = linkRole;
                            linkNode = f;
                        }
                        sources.add(new AccessContext.Source(AccessContext.SourceType.LINK, linkRole, f.getFolderId()));
                    }
                }
            }
        }

        return new AccessContext(own, link, max(own, link), linkNode, viewersCanDownload(project, nodes),
                project.getStatus(), trashed, List.copyOf(sources));
    }

    public static boolean can(AccessContext ctx, Action action) {
        if (ctx == null || ctx.role() == null) {
            return false;
        }
        if (action.blockedByStatus() && isLocked(ctx.projectStatus())) {
            return false;
        }
        if (action == Action.DOWNLOAD) {
            return atLeast(ctx.own(), AccessRole.EDITOR)
                    || (ctx.own() != null && ctx.viewersCanDownload())
                    || (ctx.link() != null && linkAllowsDownload(ctx.linkNode()) && ctx.viewersCanDownload());
        }
        return atLeast(action.ownOnly() ? ctx.own() : ctx.role(), action.minRole());
    }

    /**
     * Sap chain theo ancestorIds cua target (goc -> target) tu cac folder da load.
     * Tra empty khi lech (thieu node, khac project, parentFolderId khong khop) de service di lai theo parentFolderId.
     */
    public static Optional<List<FolderEntity>> validateChain(String projectId, FolderEntity target,
                                                             Collection<FolderEntity> loaded) {
        Map<String, FolderEntity> byId = new HashMap<>();
        if (loaded != null) {
            loaded.forEach(f -> byId.put(f.getFolderId(), f));
        }
        byId.putIfAbsent(target.getFolderId(), target);

        List<String> ids = new ArrayList<>();
        if (target.getAncestorIds() != null) {
            ids.addAll(target.getAncestorIds());
        }
        ids.add(target.getFolderId());

        List<FolderEntity> chain = new ArrayList<>(ids.size());
        String expectedParent = null;
        for (String id : ids) {
            FolderEntity f = byId.get(id);
            if (f == null || !Objects.equals(projectId, f.getProjectId())
                    || !Objects.equals(expectedParent, f.getParentFolderId())) {
                return Optional.empty();
            }
            chain.add(f);
            expectedParent = id;
        }
        return Optional.of(chain);
    }

    /**
     * Loc folder user thay duoc trong project (giu thu tu dau vao). Thanh vien thay het;
     * nguoi khac chi thay cay con tu goc truy cap. Folder trong thung rac (chinh no hoac to tien)
     * chi hien voi nguoi co vai tro project >= EDITOR. Di cay theo parentFolderId, khong tin ancestorIds.
     */
    public static List<FolderEntity> visibleFolders(ProjectEntity project, List<FolderEntity> folders,
                                                    String userId, Instant now) {
        AccessRole projectRole = projectRole(project, userId, new ArrayList<>());
        Map<String, FolderEntity> byId = new HashMap<>();
        folders.forEach(f -> byId.put(f.getFolderId(), f));
        boolean canSeeTrash = atLeast(projectRole, Action.TRASH.minRole());

        return folders.stream().filter(f -> {
            if (onPath(f, byId, AccessResolver::isTrash)) {
                return canSeeTrash;
            }
            return projectRole != null || onPath(f, byId, node -> hasDirectAccess(node, userId, now));
        }).toList();
    }

    // ---------- noi bo ----------

    private static AccessRole projectRole(ProjectEntity project, String userId, List<AccessContext.Source> sources) {
        if (project == null || userId == null) {
            return null;
        }
        AccessRole role = null;
        if (userId.equals(project.getOwnerId())) {
            role = AccessRole.OWNER;
            sources.add(new AccessContext.Source(AccessContext.SourceType.OWNER, AccessRole.OWNER, null));
        }
        if (project.getCollaborators() != null) {
            for (ProjectCollaborator c : project.getCollaborators()) {
                if (userId.equals(c.getUserId()) && c.getRole() != null) {
                    role = max(role, c.getRole());
                    sources.add(new AccessContext.Source(AccessContext.SourceType.PROJECT, c.getRole(), null));
                }
            }
        }
        return role;
    }

    private static List<AccessGrant> grantsOf(FolderEntity f, String userId) {
        if (f.getGrants() == null) {
            return List.of();
        }
        return f.getGrants().stream().filter(g -> userId.equals(g.getUserId())).toList();
    }

    private static boolean hasDirectAccess(FolderEntity f, String userId, Instant now) {
        if (userId == null) {
            return false;
        }
        for (AccessGrant g : grantsOf(f, userId)) {
            boolean viaLink = Boolean.TRUE.equals(g.getViaLink());
            if ((!viaLink && g.getRole() != null) || (viaLink && linkUsable(f.getLink(), now))) {
                return true;
            }
        }
        return false;
    }

    // link con han va co vai tro; role null = chi dung cho proof
    public static boolean linkUsable(LinkAccess link, Instant now) {
        return link != null && link.getRole() != null
                && (link.getExpiresAt() == null || now.isBefore(link.getExpiresAt()));
    }

    private static boolean linkAllowsDownload(FolderEntity linkNode) {
        return linkNode != null && linkNode.getLink() != null
                && Boolean.TRUE.equals(linkNode.getLink().getAllowDownload());
    }

    // gia tri khac null gan nhat tu folder dich di len, cuoi cung la project; mac dinh true
    private static boolean viewersCanDownload(ProjectEntity project, List<FolderEntity> chain) {
        for (int i = chain.size() - 1; i >= 0; i--) {
            FolderEntity f = chain.get(i);
            if (f.getSettings() != null && f.getSettings().getViewersCanDownload() != null) {
                return f.getSettings().getViewersCanDownload();
            }
        }
        if (project.getSettings() != null && project.getSettings().getViewersCanDownload() != null) {
            return project.getSettings().getViewersCanDownload();
        }
        return true;
    }

    // dung tren f hoac to tien nao do (di theo parentFolderId, chong vong)
    private static boolean onPath(FolderEntity f, Map<String, FolderEntity> byId, Predicate<FolderEntity> test) {
        Set<String> seen = new HashSet<>();
        for (FolderEntity node = f; node != null && seen.add(node.getFolderId());
             node = node.getParentFolderId() == null ? null : byId.get(node.getParentFolderId())) {
            if (test.test(node)) {
                return true;
            }
        }
        return false;
    }

    private static boolean isTrash(FolderEntity f) {
        return Boolean.TRUE.equals(f.getIsTrash());
    }

    private static boolean isLocked(ProjectStatus status) {
        return status == ProjectStatus.ARCHIVED || status == ProjectStatus.COMPLETED;
    }

    private static boolean atLeast(AccessRole role, AccessRole min) {
        return role != null && role.atLeast(min);
    }

    private static AccessRole max(AccessRole a, AccessRole b) {
        if (a == null) {
            return b;
        }
        if (b == null) {
            return a;
        }
        return a.compareTo(b) >= 0 ? a : b;
    }
}
