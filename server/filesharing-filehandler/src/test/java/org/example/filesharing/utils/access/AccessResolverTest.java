package org.example.filesharing.utils.access;

import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.entity.models.access.AccessGrant;
import com.file.service.filesharing.core.entity.models.access.AccessSettings;
import com.file.service.filesharing.core.entity.models.access.LinkAccess;
import com.file.service.filesharing.core.entity.models.project.ProjectCollaborator;
import com.file.service.filesharing.core.enums.ProjectStatus;
import com.file.service.filesharing.core.enums.access.AccessRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.example.filesharing.utils.access.AccessResolver.can;
import static org.example.filesharing.utils.access.AccessResolver.resolve;
import static org.junit.jupiter.api.Assertions.*;

/** JUnit thuan cho AccessResolver (AC-4), khong Spring/Mongo. */
class AccessResolverTest {

    private static final Instant NOW = Instant.parse("2026-11-12T10:00:00Z");
    private static final String OWNER = "u-owner";
    private static final String USER = "u-x";
    private static final String P = "p1";

    /**
     * Ma tran design 3.3, cot theo thu tu VIEWER, COMMENTER, EDITOR, MANAGER, OWNER.
     * Y = duoc, N = khong, S = theo cai dat viewersCanDownload.
     */
    private static final Map<Action, String> MATRIX = Map.ofEntries(
            Map.entry(Action.VIEW, "YYYYY"),
            Map.entry(Action.VIEW_PEOPLE, "YYYYY"),
            Map.entry(Action.DOWNLOAD, "SSYYY"),
            Map.entry(Action.COMMENT, "NYYYY"),
            Map.entry(Action.REVIEW_DECIDE, "NYYYY"),
            Map.entry(Action.UPLOAD, "NNYYY"),
            Map.entry(Action.EDIT, "NNYYY"),
            Map.entry(Action.TRASH, "NNYYY"),
            Map.entry(Action.DELETE_PERMANENT, "NNNYY"),
            Map.entry(Action.CREATE_REVIEW, "NNYYY"),
            Map.entry(Action.VIEW_PROOF_SELECTIONS, "NNYYY"),
            Map.entry(Action.INVITE, "NNYYY"),
            Map.entry(Action.MANAGE_ACCESS, "NNNYY"),
            Map.entry(Action.MANAGE_SETTINGS, "NNNYY"),
            Map.entry(Action.VIEW_AUDIT_LOG, "NNNYY"),
            Map.entry(Action.MANAGE_PROJECT, "NNNYY"),
            Map.entry(Action.ARCHIVE_PROJECT, "NNNNY")
    );

    // ---------- du lieu ----------

    private static ProjectEntity project(ProjectStatus status, Boolean vcd, ProjectCollaborator... members) {
        return ProjectEntity.builder()
                .projectId(P).ownerId(OWNER).status(status)
                .collaborators(new ArrayList<>(Arrays.asList(members)))
                .settings(vcd == null ? null : AccessSettings.builder().viewersCanDownload(vcd).build())
                .build();
    }

    private static ProjectEntity project() {
        return project(ProjectStatus.ACTIVE, true);
    }

    private static ProjectCollaborator member(String userId, AccessRole role) {
        return ProjectCollaborator.builder().userId(userId).role(role).build();
    }

    private static FolderEntity folder(String id, FolderEntity parent, AccessGrant... grants) {
        List<String> ancestors = new ArrayList<>();
        if (parent != null) {
            if (parent.getAncestorIds() != null) {
                ancestors.addAll(parent.getAncestorIds());
            }
            ancestors.add(parent.getFolderId());
        }
        FolderEntity f = FolderEntity.builder()
                .folderId(id).projectId(P)
                .parentFolderId(parent == null ? null : parent.getFolderId())
                .ancestorIds(ancestors)
                .grants(new ArrayList<>(Arrays.asList(grants)))
                .build();
        f.setIsTrash(false);
        f.setIsActive(true);
        return f;
    }

    private static AccessGrant grant(String userId, AccessRole role) {
        return AccessGrant.builder().userId(userId).role(role).viaLink(false).build();
    }

    private static AccessGrant viaLink(String userId) {
        return AccessGrant.builder().userId(userId).viaLink(true).build();
    }

    private static LinkAccess link(AccessRole role, boolean allowDownload, Instant expiresAt) {
        return LinkAccess.builder().token("t").role(role).allowDownload(allowDownload)
                .allowProofSelection(false).expiresAt(expiresAt).build();
    }

    private static FolderEntity vcd(FolderEntity f, Boolean value) {
        f.setSettings(AccessSettings.builder().viewersCanDownload(value).build());
        return f;
    }

    /** Ngu canh co dung vai tro role tai project: OWNER qua ownerId, con lai qua collaborator. */
    private static AccessContext projectContext(AccessRole role, ProjectStatus status, boolean vcd) {
        ProjectEntity p = role == AccessRole.OWNER
                ? project(status, vcd)
                : project(status, vcd, member(USER, role));
        return resolve(p, List.of(), role == AccessRole.OWNER ? OWNER : USER, NOW);
    }

    // ---------- ma tran ----------

    static Stream<Arguments> matrixCells() {
        List<Arguments> cells = new ArrayList<>();
        AccessRole[] roles = AccessRole.values();
        for (Action action : Action.values()) {
            String row = MATRIX.get(action);
            for (int i = 0; i < roles.length; i++) {
                cells.add(Arguments.of(action, roles[i], row.charAt(i)));
            }
        }
        return cells.stream();
    }

    @Test
    void matrixCoversEveryAction() {
        assertEquals(Action.values().length, MATRIX.size());
    }

    @ParameterizedTest(name = "{0} x {1} = {2}")
    @MethodSource("matrixCells")
    void matrixCell(Action action, AccessRole role, char expected) {
        AccessContext withSetting = projectContext(role, ProjectStatus.ACTIVE, true);
        AccessContext withoutSetting = projectContext(role, ProjectStatus.ACTIVE, false);
        switch (expected) {
            case 'Y' -> {
                assertTrue(can(withSetting, action));
                assertTrue(can(withoutSetting, action));
            }
            case 'N' -> {
                assertFalse(can(withSetting, action));
                assertFalse(can(withoutSetting, action));
            }
            case 'S' -> {
                assertTrue(can(withSetting, action));
                assertFalse(can(withoutSetting, action));
            }
            default -> fail("ky hieu la: " + expected);
        }
    }

    @ParameterizedTest
    @EnumSource(Action.class)
    void userWithoutAnyRoleCannotDoAnything(Action action) {
        AccessContext ctx = resolve(project(), List.of(), USER, NOW);
        assertNull(ctx.role());
        assertFalse(can(ctx, action));
    }

    @Test
    void anonymousUserHasNoRole() {
        assertNull(resolve(project(), List.of(), null, NOW).role());
    }

    @Test
    void collaboratorWithoutNewRoleIsIgnored() {
        // collaborator cu chua migrate (role null) khong co quyen
        ProjectEntity p = project(ProjectStatus.ACTIVE, true, member(USER, null));
        assertNull(resolve(p, List.of(), USER, NOW).role());
    }

    // ---------- ke thua chi cong ----------

    @Test
    void ownerIsOwnerEvenWithLowerCollaboratorEntry() {
        ProjectEntity p = project(ProjectStatus.ACTIVE, true, member(OWNER, AccessRole.MANAGER));
        AccessContext ctx = resolve(p, List.of(), OWNER, NOW);
        assertEquals(AccessRole.OWNER, ctx.own());
        assertTrue(ctx.sources().stream().anyMatch(s -> s.type() == AccessContext.SourceType.OWNER));
    }

    @Test
    void childGrantDoesNotLowerInheritedRole() {
        FolderEntity f1 = folder("f1", null);
        FolderEntity f1a = folder("f1a", f1, grant(USER, AccessRole.VIEWER));
        ProjectEntity p = project(ProjectStatus.ACTIVE, true, member(USER, AccessRole.EDITOR));
        AccessContext ctx = resolve(p, List.of(f1, f1a), USER, NOW);
        assertEquals(AccessRole.EDITOR, ctx.role());
        assertTrue(can(ctx, Action.UPLOAD));
    }

    @Test
    void folderGrantIsInheritedByDescendantsOnly() {
        FolderEntity f1 = folder("f1", null, grant(USER, AccessRole.COMMENTER));
        FolderEntity f1a = folder("f1a", f1);
        FolderEntity f2 = folder("f2", null);
        ProjectEntity p = project();

        AccessContext atChild = resolve(p, List.of(f1, f1a), USER, NOW);
        assertEquals(AccessRole.COMMENTER, atChild.own());
        assertTrue(can(atChild, Action.COMMENT));
        assertTrue(atChild.sources().contains(new AccessContext.Source(AccessContext.SourceType.FOLDER, AccessRole.COMMENTER, "f1")));

        assertNull(resolve(p, List.of(f2), USER, NOW).role());
        assertNull(resolve(p, List.of(), USER, NOW).role());
    }

    @Test
    void highestGrantOnChainWins() {
        FolderEntity f1 = folder("f1", null, grant(USER, AccessRole.VIEWER));
        FolderEntity f1a = folder("f1a", f1, grant(USER, AccessRole.EDITOR));
        assertEquals(AccessRole.EDITOR, resolve(project(), List.of(f1, f1a), USER, NOW).own());
        assertEquals(AccessRole.VIEWER, resolve(project(), List.of(f1), USER, NOW).own());
    }

    // ---------- cong thuc tai ----------

    @Test
    void downloadOwnEditorIgnoresSetting() {
        FolderEntity f1 = vcd(folder("f1", null, grant(USER, AccessRole.EDITOR)), false);
        assertTrue(can(resolve(project(), List.of(f1), USER, NOW), Action.DOWNLOAD));
    }

    @Test
    void downloadOwnViewerFollowsNearestSetting() {
        FolderEntity f1 = vcd(folder("f1", null), false);
        FolderEntity f1a = folder("f1a", f1);
        FolderEntity f1b = vcd(folder("f1b", f1), true);
        ProjectEntity p = project(ProjectStatus.ACTIVE, true, member(USER, AccessRole.VIEWER));

        assertTrue(can(resolve(p, List.of(), USER, NOW), Action.DOWNLOAD));
        assertFalse(can(resolve(p, List.of(f1), USER, NOW), Action.DOWNLOAD));
        // f1a null = theo cha f1 (false)
        assertFalse(can(resolve(p, List.of(f1, f1a), USER, NOW), Action.DOWNLOAD));
        // f1b dat true thi tai duoc
        assertTrue(can(resolve(p, List.of(f1, f1b), USER, NOW), Action.DOWNLOAD));
    }

    @Test
    void downloadUsesProjectSettingWhenFoldersInherit() {
        FolderEntity f1 = folder("f1", null);
        ProjectEntity off = project(ProjectStatus.ACTIVE, false, member(USER, AccessRole.COMMENTER));
        assertFalse(can(resolve(off, List.of(f1), USER, NOW), Action.DOWNLOAD));
        // project chua co settings thi mac dinh true
        ProjectEntity legacy = project(ProjectStatus.ACTIVE, null, member(USER, AccessRole.COMMENTER));
        assertTrue(can(resolve(legacy, List.of(f1), USER, NOW), Action.DOWNLOAD));
    }

    @Test
    void downloadViaLinkNeedsAllowDownloadAndSetting() {
        FolderEntity open = folder("f1", null, viaLink(USER));
        open.setLink(link(AccessRole.VIEWER, true, null));
        assertTrue(can(resolve(project(), List.of(open), USER, NOW), Action.DOWNLOAD));

        FolderEntity noDownload = folder("f1", null, viaLink(USER));
        noDownload.setLink(link(AccessRole.VIEWER, false, null));
        assertFalse(can(resolve(project(), List.of(noDownload), USER, NOW), Action.DOWNLOAD));

        // link allowDownload=true khong vuot duoc viewersCanDownload=false
        FolderEntity blocked = vcd(folder("f1", null, viaLink(USER)), false);
        blocked.setLink(link(AccessRole.COMMENTER, true, null));
        assertFalse(can(resolve(project(), List.of(blocked), USER, NOW), Action.DOWNLOAD));
    }

    // ---------- link ----------

    @Test
    void activeLinkGivesLinkRoleButNotOwnRole() {
        FolderEntity f1 = folder("f1", null, viaLink(USER));
        f1.setLink(link(AccessRole.COMMENTER, false, NOW.plus(Duration.ofDays(1))));
        FolderEntity f1a = folder("f1a", f1);
        AccessContext ctx = resolve(project(), List.of(f1, f1a), USER, NOW);

        assertNull(ctx.own());
        assertEquals(AccessRole.COMMENTER, ctx.link());
        assertEquals(AccessRole.COMMENTER, ctx.role());
        assertSame(f1, ctx.linkNode());
        assertTrue(can(ctx, Action.VIEW));
        assertTrue(can(ctx, Action.COMMENT));
        // VIEW_PEOPLE va hanh dong quan ly chi tinh ownRole
        assertFalse(can(ctx, Action.VIEW_PEOPLE));
        assertFalse(can(ctx, Action.INVITE));
    }

    @Test
    void lowerLinkRoleTakesEffectImmediately() {
        FolderEntity f1 = folder("f1", null, viaLink(USER));
        f1.setLink(link(AccessRole.VIEWER, false, null));
        AccessContext ctx = resolve(project(), List.of(f1), USER, NOW);
        assertTrue(can(ctx, Action.VIEW));
        assertFalse(can(ctx, Action.COMMENT));
    }

    @Test
    void expiredLinkIsIgnored() {
        FolderEntity f1 = folder("f1", null, viaLink(USER));
        f1.setLink(link(AccessRole.COMMENTER, true, NOW.minusSeconds(1)));
        assertNull(resolve(project(), List.of(f1), USER, NOW).role());
    }

    @Test
    void linkWithNullRoleIsProofOnly() {
        FolderEntity f1 = folder("f1", null, viaLink(USER));
        f1.setLink(link(null, true, null));
        assertNull(resolve(project(), List.of(f1), USER, NOW).role());
    }

    @Test
    void viaLinkGrantWithoutLinkIsIgnored() {
        FolderEntity f1 = folder("f1", null, viaLink(USER));
        assertNull(resolve(project(), List.of(f1), USER, NOW).role());
    }

    @Test
    void linkDoesNotOpenSiblingOrParent() {
        FolderEntity root = folder("root", null);
        FolderEntity x = folder("x", root, viaLink(USER));
        x.setLink(link(AccessRole.COMMENTER, false, null));
        FolderEntity sibling = folder("y", root);
        assertNull(resolve(project(), List.of(root), USER, NOW).role());
        assertNull(resolve(project(), List.of(root, sibling), USER, NOW).role());
        assertEquals(AccessRole.COMMENTER, resolve(project(), List.of(root, x), USER, NOW).role());
    }

    // ---------- cong trang thai ----------

    @ParameterizedTest
    @EnumSource(value = ProjectStatus.class, names = {"ARCHIVED", "COMPLETED"})
    void lockedProjectBlocksWriteActionsEvenForOwner(ProjectStatus status) {
        AccessContext ctx = projectContext(AccessRole.OWNER, status, true);
        for (Action action : Action.values()) {
            assertEquals(!action.blockedByStatus(), can(ctx, action), action.name());
        }
        assertTrue(can(ctx, Action.MANAGE_PROJECT));
        assertTrue(can(ctx, Action.ARCHIVE_PROJECT));
        assertTrue(can(ctx, Action.VIEW));
        assertTrue(can(ctx, Action.DOWNLOAD));
        assertFalse(can(ctx, Action.COMMENT));
        assertFalse(can(ctx, Action.UPLOAD));
    }

    @Test
    void statusGateListMatchesDesign() {
        List<Action> gated = Arrays.stream(Action.values()).filter(Action::blockedByStatus).toList();
        assertEquals(List.of(Action.COMMENT, Action.REVIEW_DECIDE, Action.UPLOAD, Action.EDIT, Action.TRASH,
                Action.DELETE_PERMANENT, Action.CREATE_REVIEW, Action.INVITE, Action.MANAGE_ACCESS,
                Action.MANAGE_SETTINGS), gated);
    }

    @Test
    void managerCanManageProjectWhenCompleted() {
        AccessContext ctx = projectContext(AccessRole.MANAGER, ProjectStatus.COMPLETED, true);
        assertTrue(can(ctx, Action.MANAGE_PROJECT));
        assertFalse(can(ctx, Action.ARCHIVE_PROJECT));
    }

    // ---------- thung rac ----------

    @Test
    void trashedAncestorHidesFolderFromFolderGuest() {
        FolderEntity f1 = folder("f1", null, grant(USER, AccessRole.EDITOR));
        f1.setIsTrash(true);
        FolderEntity f1a = folder("f1a", f1);
        AccessContext ctx = resolve(project(), List.of(f1, f1a), USER, NOW);
        assertTrue(ctx.trashed());
        assertNull(ctx.role());
    }

    @Test
    void trashedFolderVisibleOnlyToProjectEditorOrAbove() {
        FolderEntity f1 = folder("f1", null);
        f1.setIsTrash(true);
        FolderEntity f1a = folder("f1a", f1);

        ProjectEntity viewer = project(ProjectStatus.ACTIVE, true, member(USER, AccessRole.VIEWER));
        assertNull(resolve(viewer, List.of(f1, f1a), USER, NOW).role());

        ProjectEntity editor = project(ProjectStatus.ACTIVE, true, member(USER, AccessRole.EDITOR));
        AccessContext ctx = resolve(editor, List.of(f1, f1a), USER, NOW);
        assertEquals(AccessRole.EDITOR, ctx.role());
        assertTrue(can(ctx, Action.TRASH));

        assertEquals(AccessRole.OWNER, resolve(project(), List.of(f1, f1a), OWNER, NOW).role());
    }

    @Test
    void viaLinkIgnoredWhenFolderTrashed() {
        FolderEntity f1 = folder("f1", null, viaLink(USER));
        f1.setLink(link(AccessRole.COMMENTER, true, null));
        f1.setIsTrash(true);
        assertNull(resolve(project(), List.of(f1), USER, NOW).role());
    }

    @Test
    void trashedAssetHiddenFromProjectViewer() {
        ProjectEntity viewer = project(ProjectStatus.ACTIVE, true, member(USER, AccessRole.VIEWER));
        assertNull(resolve(viewer, List.of(), USER, NOW, true).role());
        assertEquals(AccessRole.VIEWER, resolve(viewer, List.of(), USER, NOW, false).role());
    }

    // ---------- chain lech ----------

    @Test
    void validChainIsOrderedByAncestorIdsNotByLoadOrder() {
        FolderEntity a = folder("a", null);
        FolderEntity b = folder("b", a);
        FolderEntity c = folder("c", b);
        b.setLevel(99);
        var chain = AccessResolver.validateChain(P, c, List.of(c, b, a));
        assertTrue(chain.isPresent());
        assertEquals(List.of("a", "b", "c"), chain.get().stream().map(FolderEntity::getFolderId).toList());
    }

    @Test
    void staleAncestorIdsAreRejected() {
        // c da move tu old sang neu nhung ancestorIds van tro old
        FolderEntity old = folder("old", null, grant(USER, AccessRole.EDITOR));
        FolderEntity neu = folder("new", null);
        FolderEntity c = folder("c", old);
        c.setParentFolderId("new");
        assertTrue(AccessResolver.validateChain(P, c, List.of(old, c)).isEmpty());

        // service di lai theo parentFolderId: chain dung khong cap quyen tu to tien cu
        assertNull(resolve(project(), List.of(neu, c), USER, NOW).role());
    }

    @Test
    void chainWithMissingNodeIsRejected() {
        FolderEntity a = folder("a", null);
        FolderEntity b = folder("b", a);
        FolderEntity c = folder("c", b);
        assertTrue(AccessResolver.validateChain(P, c, List.of(a, c)).isEmpty());
    }

    @Test
    void chainFromOtherProjectIsRejected() {
        FolderEntity a = folder("a", null);
        a.setProjectId("p-other");
        FolderEntity b = folder("b", a);
        assertTrue(AccessResolver.validateChain(P, b, List.of(a, b)).isEmpty());
    }

    @Test
    void chainWhoseRootHasParentIsRejected() {
        FolderEntity a = folder("a", null);
        a.setParentFolderId("ghost");
        FolderEntity b = folder("b", a);
        assertTrue(AccessResolver.validateChain(P, b, List.of(a, b)).isEmpty());
    }

    @Test
    void rootFolderChainIsItself() {
        FolderEntity a = folder("a", null);
        assertEquals(List.of(a), AccessResolver.validateChain(P, a, List.of(a)).orElseThrow());
    }

    // ---------- ai thay gi ----------

    @Test
    void memberSeesWholeTree() {
        FolderEntity f1 = folder("f1", null);
        FolderEntity f1a = folder("f1a", f1);
        FolderEntity f2 = folder("f2", null);
        ProjectEntity p = project(ProjectStatus.ACTIVE, true, member(USER, AccessRole.VIEWER));
        assertEquals(List.of(f1, f1a, f2), AccessResolver.visibleFolders(p, List.of(f1, f1a, f2), USER, NOW));
        assertEquals(List.of(f1, f1a, f2), AccessResolver.visibleFolders(p, List.of(f1, f1a, f2), OWNER, NOW));
    }

    @Test
    void guestSeesOnlySubtreeOfAccessRoot() {
        FolderEntity f1 = folder("f1", null, grant(USER, AccessRole.COMMENTER));
        FolderEntity f1a = folder("f1a", f1);
        FolderEntity f2 = folder("f2", null);
        FolderEntity f3 = folder("f3", null);
        FolderEntity f3a = folder("f3a", f3, viaLink(USER));
        f3a.setLink(link(AccessRole.VIEWER, false, null));
        FolderEntity f3b = folder("f3b", f3);
        List<FolderEntity> all = List.of(f1, f1a, f2, f3, f3a, f3b);
        assertEquals(List.of(f1, f1a, f3a), AccessResolver.visibleFolders(project(), all, USER, NOW));
        assertEquals(List.of(), AccessResolver.visibleFolders(project(), all, "u-stranger", NOW));
    }

    @Test
    void guestDoesNotSeeExpiredLinkOrTrash() {
        FolderEntity f1 = folder("f1", null, viaLink(USER));
        f1.setLink(link(AccessRole.VIEWER, false, NOW.minusSeconds(1)));
        FolderEntity f2 = folder("f2", null, grant(USER, AccessRole.EDITOR));
        f2.setIsTrash(true);
        FolderEntity f2a = folder("f2a", f2);
        assertEquals(List.of(), AccessResolver.visibleFolders(project(), List.of(f1, f2, f2a), USER, NOW));
    }

    @Test
    void trashedFoldersVisibleOnlyToProjectEditor() {
        FolderEntity f1 = folder("f1", null);
        FolderEntity f2 = folder("f2", null);
        f2.setIsTrash(true);
        FolderEntity f2a = folder("f2a", f2);
        List<FolderEntity> all = List.of(f1, f2, f2a);
        ProjectEntity viewer = project(ProjectStatus.ACTIVE, true, member(USER, AccessRole.VIEWER));
        assertEquals(List.of(f1), AccessResolver.visibleFolders(viewer, all, USER, NOW));
        ProjectEntity editor = project(ProjectStatus.ACTIVE, true, member(USER, AccessRole.EDITOR));
        assertEquals(all, AccessResolver.visibleFolders(editor, all, USER, NOW));
    }

    @Test
    void visibilityFollowsParentFolderIdNotStaleAncestorIds() {
        FolderEntity old = folder("old", null, grant(USER, AccessRole.VIEWER));
        FolderEntity neu = folder("new", null);
        FolderEntity c = folder("c", old);
        c.setParentFolderId("new");
        assertEquals(List.of(old), AccessResolver.visibleFolders(project(), List.of(old, neu, c), USER, NOW));
    }
}
