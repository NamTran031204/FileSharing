package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.AssetEntity;
import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.entity.models.access.AccessGrant;
import com.file.service.filesharing.core.entity.models.project.ProjectCollaborator;
import com.file.service.filesharing.core.enums.ProjectStatus;
import com.file.service.filesharing.core.enums.access.AccessRole;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import org.bson.Document;
import org.example.filesharing.entities.dtos.access.MyAccessDTO;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.repositories.FolderRepo;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.utils.access.AccessContext;
import org.example.filesharing.utils.access.Action;
import org.example.filesharing.utils.access.ResourceRef;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/** AccessServiceImpl: tai du lieu + kiem quyen (T6). Mongo gia lap bang map folder theo id. */
class AccessServiceImplTest {

    private static final String OWNER = "u-owner";
    private static final String GUEST = "u-guest";
    private static final String MEMBER = "u-member";
    private static final String P = "p1";

    private ProjectRepo projectRepo;
    private FolderRepo folderRepo;
    private AssetRepo assetRepo;
    private MongoTemplate mongoTemplate;
    private AuditService auditService;
    private AccessServiceImpl service;

    private ProjectEntity project;
    private final Map<String, FolderEntity> folders = new HashMap<>();

    @BeforeEach
    void setUp() {
        projectRepo = mock(ProjectRepo.class);
        folderRepo = mock(FolderRepo.class);
        assetRepo = mock(AssetRepo.class);
        mongoTemplate = mock(MongoTemplate.class);
        auditService = mock(AuditService.class);
        service = new AccessServiceImpl(projectRepo, folderRepo, assetRepo, mongoTemplate, auditService);

        project = ProjectEntity.builder().projectId(P).ownerId(OWNER).status(ProjectStatus.ACTIVE)
                .collaborators(new ArrayList<>(List.of(
                        ProjectCollaborator.builder().userId(MEMBER).role(AccessRole.VIEWER).build())))
                .build();
        project.setIsActive(true);
        when(projectRepo.findById(P)).thenAnswer(inv -> Optional.of(project));

        // cay: F1 -> F1a, F2 o goc
        folder("F1", null);
        folder("F1a", "F1", "F1");
        folder("F2", null);

        when(folderRepo.findById(anyString())).thenAnswer(inv -> Optional.ofNullable(folders.get(inv.<String>getArgument(0))));
        when(mongoTemplate.find(any(Query.class), eq(FolderEntity.class))).thenAnswer(inv -> byIds(inv.getArgument(0)));
        when(mongoTemplate.findOne(any(Query.class), eq(FolderEntity.class))).thenAnswer(inv -> {
            List<FolderEntity> found = byIds(inv.getArgument(0));
            return found.isEmpty() ? null : found.get(0);
        });
        asUser(GUEST);
    }

    // ---------- loi quyen ----------

    @Test
    void userWithoutRoleGetsAccessDenied() {
        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.require(ResourceRef.folder("F1"), Action.VIEW));
        assertEquals(ErrorCode.ACCESS_DENIED, e.getErrorCode());
    }

    @Test
    void adminWithoutRoleIsNotBypassed() {
        // service khong doc vai tro he thong; admin khong co vai tro tai tai nguyen thi bi tu choi nhu moi user
        asUser("u-admin");
        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.require(ResourceRef.project(P), Action.VIEW));
        assertEquals(ErrorCode.ACCESS_DENIED, e.getErrorCode());
    }

    @Test
    void roleWithoutActionGetsActionNotAllowedNamingMinRole() {
        grant("F1", GUEST, AccessRole.COMMENTER);

        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.require(ResourceRef.folder("F1a"), Action.UPLOAD));

        assertEquals(ErrorCode.ACTION_NOT_ALLOWED, e.getErrorCode());
        assertNotEquals(ErrorCode.ACCESS_DENIED, e.getErrorCode());
        assertArrayEquals(new Object[]{"EDITOR"}, e.getArgs());
        assertTrue(localized(e, Locale.forLanguageTag("vi")).contains("EDITOR"));
        assertTrue(localized(e, Locale.ENGLISH).contains("EDITOR"));
    }

    @Test
    void lockedProjectNamesStatusInsteadOfRole() {
        grant("F1", GUEST, AccessRole.EDITOR);
        project.setStatus(ProjectStatus.ARCHIVED);

        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.require(ResourceRef.folder("F1a"), Action.UPLOAD));

        assertEquals(ErrorCode.ACTION_NOT_ALLOWED, e.getErrorCode());
        assertArrayEquals(new Object[]{"ARCHIVED"}, e.getArgs());
        assertTrue(localized(e, Locale.forLanguageTag("vi")).contains("ARCHIVED"));
    }

    @Test
    void linkOnlyUserGetsActionNotAllowedOnOwnOnlyAction() {
        folders.get("F1").setLink(com.file.service.filesharing.core.entity.models.access.LinkAccess.builder()
                .role(AccessRole.COMMENTER).build());
        folders.get("F1").setGrants(new ArrayList<>(List.of(AccessGrant.builder().userId(GUEST).viaLink(true).build())));

        assertEquals(AccessRole.COMMENTER, service.require(ResourceRef.folder("F1a"), Action.COMMENT).role());
        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.require(ResourceRef.folder("F1a"), Action.VIEW_PEOPLE));
        assertEquals(ErrorCode.ACTION_NOT_ALLOWED, e.getErrorCode());
    }

    @Test
    void canReturnsFalseInsteadOfThrowing() {
        assertFalse(service.can(ResourceRef.folder("F1"), Action.VIEW));
        asUser(OWNER);
        assertTrue(service.can(ResourceRef.folder("F1"), Action.DELETE_PERMANENT));
    }

    // ---------- tai chain ----------

    @Test
    void folderRequireLoadsChainWithOneProjectedInQuery() {
        grant("F1", GUEST, AccessRole.EDITOR);

        AccessContext ctx = service.require(ResourceRef.folder("F1a"), Action.UPLOAD);

        assertEquals(AccessRole.EDITOR, ctx.own());
        ArgumentCaptor<Query> captor = ArgumentCaptor.forClass(Query.class);
        verify(mongoTemplate, times(1)).find(captor.capture(), eq(FolderEntity.class));
        verify(mongoTemplate, never()).findOne(any(Query.class), eq(FolderEntity.class));
        assertEquals(List.of("F1", "F1a"), idsOf(captor.getValue()));
        Document fields = captor.getValue().getFieldsObject();
        for (String f : List.of("parentFolderId", "projectId", "grants", "link", "settings", "isActive", "isTrash")) {
            assertEquals(1, fields.get(f), "projection thieu " + f);
        }
    }

    @Test
    void staleAncestorIdsWalkParentFolderIdAndIgnoreOldAncestor() {
        // F1a da chuyen sang cha F1 nhung ancestorIds con tro F2 (move bi ngat)
        folders.get("F1a").setAncestorIds(List.of("F2"));
        grant("F2", GUEST, AccessRole.EDITOR);

        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.require(ResourceRef.folder("F1a"), Action.VIEW));
        assertEquals(ErrorCode.ACCESS_DENIED, e.getErrorCode());
        verify(mongoTemplate, times(1)).findOne(any(Query.class), eq(FolderEntity.class));

        grant("F1", GUEST, AccessRole.COMMENTER);
        assertEquals(AccessRole.COMMENTER, service.require(ResourceRef.folder("F1a"), Action.COMMENT).own());
    }

    @Test
    void inactiveFolderIsNotFound() {
        folders.get("F1a").setIsActive(false);
        asUser(OWNER);
        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.require(ResourceRef.folder("F1a"), Action.VIEW));
        assertEquals(ErrorCode.FOLDER_NOT_FOUND, e.getErrorCode());
    }

    @Test
    void inactiveAncestorMakesFolderNotFound() {
        folders.get("F1").setIsActive(false);
        asUser(OWNER);
        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.require(ResourceRef.folder("F1a"), Action.VIEW));
        assertEquals(ErrorCode.FOLDER_NOT_FOUND, e.getErrorCode());
    }

    @Test
    void missingFolderIsNotFound() {
        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.require(ResourceRef.folder("nope"), Action.VIEW));
        assertEquals(ErrorCode.FOLDER_NOT_FOUND, e.getErrorCode());
    }

    @Test
    void inactiveProjectIsNotFound() {
        project.setIsActive(false);
        asUser(OWNER);
        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.require(ResourceRef.project(P), Action.VIEW));
        assertEquals(ErrorCode.PROJECT_NOT_FOUND, e.getErrorCode());
    }

    // ---------- project ----------

    @Test
    void projectRefUsesProjectRoleWithoutFolderQuery() {
        asUser(MEMBER);
        assertEquals(AccessRole.VIEWER, service.require(ResourceRef.project(P), Action.VIEW).own());
        verify(mongoTemplate, never()).find(any(Query.class), eq(FolderEntity.class));
    }

    @Test
    void lockedProjectBlocksWriteWithActionNotAllowed() {
        project.setStatus(ProjectStatus.ARCHIVED);
        asUser(OWNER);
        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.require(ResourceRef.folder("F1"), Action.UPLOAD));
        assertEquals(ErrorCode.ACTION_NOT_ALLOWED, e.getErrorCode());
    }

    // ---------- asset ----------

    @Test
    void assetInFolderUsesFolderChain() {
        asset("A1", "F1a", false);
        grant("F1", GUEST, AccessRole.VIEWER);

        assertEquals(AccessRole.VIEWER, service.require(ResourceRef.asset("A1"), Action.VIEW).role());
        verify(mongoTemplate, times(1)).find(any(Query.class), eq(FolderEntity.class));
    }

    @Test
    void assetAtProjectRootNeedsNoFolderQuery() {
        asset("A0", null, false);
        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.require(ResourceRef.asset("A0"), Action.VIEW));
        assertEquals(ErrorCode.ACCESS_DENIED, e.getErrorCode());
        verify(mongoTemplate, never()).find(any(Query.class), eq(FolderEntity.class));
    }

    @Test
    void trashedAssetOnlyForProjectEditorOrAbove() {
        asset("A1", "F1", true);
        asUser(MEMBER);
        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.require(ResourceRef.asset("A1"), Action.VIEW));
        assertEquals(ErrorCode.ACCESS_DENIED, e.getErrorCode());

        asUser(OWNER);
        assertTrue(service.require(ResourceRef.asset("A1"), Action.TRASH).trashed());
    }

    @Test
    void inactiveOrMissingAssetIsNotFound() {
        asset("A1", "F1", false).setIsActive(false);
        asUser(OWNER);
        assertEquals(ErrorCode.NOT_FOUND, assertThrows(FileBusinessException.class,
                () -> service.require(ResourceRef.asset("A1"), Action.VIEW)).getErrorCode());
        assertEquals(ErrorCode.NOT_FOUND, assertThrows(FileBusinessException.class,
                () -> service.require(ResourceRef.asset("nope"), Action.VIEW)).getErrorCode());
    }

    // ---------- resolve / filterVisible ----------

    @Test
    void resolveWithExplicitUserDoesNotReadCurrentUser() {
        AccessContext ctx = service.resolve(ResourceRef.folder("F1"), OWNER);
        assertEquals(AccessRole.OWNER, ctx.own());
        verify(auditService, never()).getCurrentUserId();
        verify(auditService, never()).getCurrentUser();
    }

    @Test
    void resolveWithoutRoleDoesNotThrow() {
        assertNull(service.resolve(ResourceRef.folder("F2")).role());
    }

    @Test
    void filterVisibleShowsGuestOnlySubtreeOfGrantedRoot() {
        grant("F1", GUEST, AccessRole.COMMENTER);
        List<FolderEntity> all = List.of(folders.get("F1"), folders.get("F1a"), folders.get("F2"));

        List<String> visible = service.filterVisible(project, all).stream().map(FolderEntity::getFolderId).toList();

        assertEquals(List.of("F1", "F1a"), visible);
        verifyNoInteractions(mongoTemplate);
    }

    // ---------- myAccess (T17) ----------

    @Test
    void myAccessListsCapabilitiesAndSources() {
        grant("F1", GUEST, AccessRole.COMMENTER);

        MyAccessDTO my = service.myAccess(ResourceRef.folder("F1a"));

        assertEquals(AccessRole.COMMENTER, my.getRole());
        assertEquals(AccessRole.COMMENTER, my.getOwnRole());
        assertTrue(my.getCapabilities().containsAll(List.of(Action.VIEW, Action.VIEW_PEOPLE, Action.COMMENT, Action.DOWNLOAD)));
        assertFalse(my.getCapabilities().contains(Action.UPLOAD));
        assertFalse(my.getCapabilities().contains(Action.MANAGE_ACCESS));
        assertEquals(1, my.getSources().size());
        assertEquals(AccessContext.SourceType.FOLDER, my.getSources().get(0).getType());
        assertEquals("F1", my.getSources().get(0).getFolderId());
    }

    @Test
    void myAccessWithoutRoleIsEmptyAndDoesNotThrow() {
        MyAccessDTO my = service.myAccess(ResourceRef.project(P));

        assertNull(my.getRole());
        assertNull(my.getOwnRole());
        assertTrue(my.getCapabilities().isEmpty());
        assertTrue(my.getSources().isEmpty());
    }

    // ---------- helper ----------

    private void asUser(String userId) {
        when(auditService.getCurrentUserId()).thenReturn(userId);
    }

    private FolderEntity folder(String id, String parentId, String... ancestors) {
        FolderEntity f = FolderEntity.builder().folderId(id).projectId(P).parentFolderId(parentId)
                .ancestorIds(List.of(ancestors)).build();
        f.setIsActive(true);
        f.setIsTrash(false);
        folders.put(id, f);
        return f;
    }

    private void grant(String folderId, String userId, AccessRole role) {
        FolderEntity f = folders.get(folderId);
        List<AccessGrant> grants = f.getGrants() == null ? new ArrayList<>() : new ArrayList<>(f.getGrants());
        grants.add(AccessGrant.builder().userId(userId).role(role).viaLink(false).build());
        f.setGrants(grants);
    }

    private AssetEntity asset(String id, String folderId, boolean trashed) {
        AssetEntity a = AssetEntity.builder().assetId(id).projectId(P).folderId(folderId).build();
        a.setIsActive(true);
        a.setIsTrash(trashed);
        when(assetRepo.findById(id)).thenReturn(Optional.of(a));
        return a;
    }

    @SuppressWarnings("unchecked")
    private static List<String> idsOf(Query query) {
        Object id = query.getQueryObject().get("_id");
        if (id instanceof Document d && d.get("$in") instanceof Collection<?> in) {
            return in.stream().map(String::valueOf).toList();
        }
        return List.of(String.valueOf(id));
    }

    private List<FolderEntity> byIds(Query query) {
        return idsOf(query).stream().map(folders::get).filter(java.util.Objects::nonNull).toList();
    }

    private static String localized(FileBusinessException e, Locale locale) {
        ResourceBundleMessageSource source = new ResourceBundleMessageSource();
        source.setBasename("i18n/messages");
        source.setDefaultEncoding("UTF-8");
        source.setFallbackToSystemLocale(false);
        return source.getMessage(e.getMessage(), e.getArgs(), locale);
    }
}
