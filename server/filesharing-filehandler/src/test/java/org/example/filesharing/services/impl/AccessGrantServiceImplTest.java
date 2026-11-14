package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.entity.models.access.AccessGrant;
import com.file.service.filesharing.core.entity.models.access.LinkAccess;
import com.file.service.filesharing.core.entity.models.project.ProjectCollaborator;
import com.file.service.filesharing.core.enums.AuditAction;
import com.file.service.filesharing.core.enums.ProjectStatus;
import com.file.service.filesharing.core.enums.access.AccessRole;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import com.file.service.filesharing.core.exceptions.specException.UserBusinessException;
import com.mongodb.client.result.UpdateResult;
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
import org.example.filesharing.services.AccessService;
import org.example.filesharing.services.AuditLogService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.ProjectService;
import org.example.filesharing.utils.access.AccessContext;
import org.example.filesharing.utils.access.Action;
import org.example.filesharing.utils.access.ResourceRef;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.mongodb.core.query.UpdateDefinition;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/** Ma tran moi/sua/xoa grant va gia tri role cua API /api/access (T14). */
class AccessGrantServiceImplTest {

    private static final String PX = "px";
    private static final String F1 = "f1";
    private static final String OWNER = "u1";
    private static final String CALLER = "u2";
    private static final String TARGET = "u3";
    private static final String TARGET_EMAIL = "u3@test.local";

    private AccessService accessService;
    private ProjectService projectService;
    private UserRepo userRepo;
    private MongoTemplate mongoTemplate;
    private AuditService auditService;
    private AuditLogService auditLogService;
    private FolderRepo folderRepo;
    private AccessGrantServiceImpl service;

    @BeforeEach
    void setUp() {
        accessService = mock(AccessService.class);
        projectService = mock(ProjectService.class);
        userRepo = mock(UserRepo.class);
        mongoTemplate = mock(MongoTemplate.class);
        auditService = mock(AuditService.class);
        auditLogService = mock(AuditLogService.class);
        folderRepo = mock(FolderRepo.class);
        service = new AccessGrantServiceImpl(accessService, projectService, mock(ProjectRepo.class),
                folderRepo, userRepo, mongoTemplate, auditService, auditLogService);

        when(auditService.getCurrentUserId()).thenReturn(CALLER);
        when(userRepo.findByEmail(TARGET_EMAIL)).thenReturn(Optional.of(UserEntity.builder().userId(TARGET).build()));
        when(mongoTemplate.updateFirst(any(Query.class), any(UpdateDefinition.class), any(Class.class)))
                .thenReturn(UpdateResult.acknowledged(1, 1L, null));
    }

    private static AccessContext ctx(AccessRole own) {
        return new AccessContext(own, null, own, null, true, ProjectStatus.ACTIVE, false, List.of());
    }

    private static GrantRequestDTO invite(String role) {
        GrantRequestDTO dto = new GrantRequestDTO();
        dto.setEmail(TARGET_EMAIL);
        dto.setRole(role);
        return dto;
    }

    private static GrantRoleRequestDTO role(String role) {
        GrantRoleRequestDTO dto = new GrantRoleRequestDTO();
        dto.setRole(role);
        return dto;
    }

    private void callerHas(ResourceRef ref, AccessRole own) {
        when(accessService.require(eq(ref), any())).thenReturn(ctx(own));
    }

    // ---------- gia tri role ----------

    @Test
    void restrictedRoleIsBadRequest() {
        callerHas(ResourceRef.folder(F1), AccessRole.OWNER);

        UserBusinessException e = assertThrows(UserBusinessException.class,
                () -> service.addGrant("folder", F1, invite("RESTRICTED")));

        assertEquals(ErrorCode.BAD_REQUEST, e.getErrorCode());
        verifyNoInteractions(mongoTemplate);
    }

    @Test
    void managerOnFolderIsBadRequest() {
        callerHas(ResourceRef.folder(F1), AccessRole.OWNER);

        UserBusinessException e = assertThrows(UserBusinessException.class,
                () -> service.addGrant("folder", F1, invite("MANAGER")));

        assertEquals(ErrorCode.BAD_REQUEST, e.getErrorCode());
        verifyNoInteractions(mongoTemplate);
    }

    @Test
    void ownerViaGrantIsActionNotAllowed() {
        callerHas(ResourceRef.project(PX), AccessRole.OWNER);

        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.addGrant("project", PX, invite("OWNER")));
        FileBusinessException e2 = assertThrows(FileBusinessException.class,
                () -> service.changeRole("project", PX, TARGET, role("OWNER")));

        assertEquals(ErrorCode.ACTION_NOT_ALLOWED, e.getErrorCode());
        assertEquals(ErrorCode.ACTION_NOT_ALLOWED, e2.getErrorCode());
        verifyNoInteractions(mongoTemplate);
    }

    @Test
    void unknownTypeIsBadRequest() {
        UserBusinessException e = assertThrows(UserBusinessException.class,
                () -> service.addGrant("asset", "a1", invite("VIEWER")));

        assertEquals(ErrorCode.BAD_REQUEST, e.getErrorCode());
        verifyNoInteractions(accessService, mongoTemplate);
    }

    // ---------- moi ----------

    @Test
    void inviteNeedsInviteAction() {
        when(accessService.require(ResourceRef.folder(F1), Action.INVITE))
                .thenThrow(new FileBusinessException(ErrorCode.ACTION_NOT_ALLOWED));

        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.addGrant("folder", F1, invite("VIEWER")));

        assertEquals(ErrorCode.ACTION_NOT_ALLOWED, e.getErrorCode());
        verifyNoInteractions(mongoTemplate);
    }

    @Test
    void editorCannotInviteManager() {
        callerHas(ResourceRef.project(PX), AccessRole.EDITOR);

        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.addGrant("project", PX, invite("MANAGER")));

        assertEquals(ErrorCode.ACTION_NOT_ALLOWED, e.getErrorCode());
        verifyNoInteractions(mongoTemplate);
    }

    @Test
    void unknownEmailIsBadRequest() {
        callerHas(ResourceRef.folder(F1), AccessRole.EDITOR);
        GrantRequestDTO dto = invite("VIEWER");
        dto.setEmail("nobody@test.local");

        UserBusinessException e = assertThrows(UserBusinessException.class, () -> service.addGrant("folder", F1, dto));

        assertEquals(ErrorCode.BAD_REQUEST, e.getErrorCode());
        verifyNoInteractions(mongoTemplate);
    }

    @Test
    void folderInviteReplacesViaLinkGrantThenPushesWhenAbsent() {
        callerHas(ResourceRef.folder(F1), AccessRole.EDITOR);

        service.addGrant("folder", F1, invite("EDITOR"));

        ArgumentCaptor<Query> queries = ArgumentCaptor.forClass(Query.class);
        ArgumentCaptor<Update> updates = ArgumentCaptor.forClass(Update.class);
        verify(mongoTemplate, times(2)).updateFirst(queries.capture(), updates.capture(), eq(FolderEntity.class));

        Document pull = (Document) updates.getAllValues().get(0).getUpdateObject().get("$pull");
        assertEquals(new Document("userId", TARGET).append("viaLink", true), pull.get("grants"));

        Document pushQuery = queries.getAllValues().get(1).getQueryObject();
        assertEquals(F1, pushQuery.get("_id"));
        assertEquals(new Document("$ne", TARGET), pushQuery.get("grants.userId"));
        AccessGrant grant = (AccessGrant) ((Document) updates.getAllValues().get(1).getUpdateObject().get("$push")).get("grants");
        assertEquals(TARGET, grant.getUserId());
        assertEquals(AccessRole.EDITOR, grant.getRole());
        assertNull(grant.getViaLink());
        assertEquals(CALLER, grant.getGrantedBy());

        // AuditLogServiceImpl tu choi PERMISSION_CHANGE thieu before/after
        ArgumentCaptor<AuditLogCreateDTO> audit = ArgumentCaptor.forClass(AuditLogCreateDTO.class);
        verify(auditLogService).createAuditLog(audit.capture());
        assertEquals(AuditAction.PERMISSION_CHANGE, audit.getValue().getAction());
        assertTrue(audit.getValue().getChanges().getBefore() != null && audit.getValue().getChanges().getAfter() != null);
    }

    @Test
    void projectInviteWritesRoleOnlyWithoutTouchingFolders() {
        callerHas(ResourceRef.project(PX), AccessRole.MANAGER);

        service.addGrant("project", PX, invite("MANAGER"));

        ArgumentCaptor<Query> query = ArgumentCaptor.forClass(Query.class);
        ArgumentCaptor<Update> update = ArgumentCaptor.forClass(Update.class);
        verify(mongoTemplate).updateFirst(query.capture(), update.capture(), eq(ProjectEntity.class));
        verify(mongoTemplate, never()).updateFirst(any(Query.class), any(UpdateDefinition.class), eq(FolderEntity.class));
        verify(mongoTemplate, never()).updateMulti(any(Query.class), any(UpdateDefinition.class), eq(FolderEntity.class));

        assertEquals(new Document("$ne", TARGET), query.getValue().getQueryObject().get("collaborators.userId"));
        ProjectCollaborator c = (ProjectCollaborator) ((Document) update.getValue().getUpdateObject().get("$push"))
                .get("collaborators");
        assertEquals(AccessRole.MANAGER, c.getRole());
        assertEquals(CALLER, c.getAddedBy());
        assertTrue(c.getAddedAt() != null);
    }

    // ---------- doi vai tro ----------

    @Test
    void changeRoleNeedsManageAccess() {
        when(accessService.require(ResourceRef.project(PX), Action.MANAGE_ACCESS))
                .thenThrow(new FileBusinessException(ErrorCode.ACTION_NOT_ALLOWED));

        assertThrows(FileBusinessException.class, () -> service.changeRole("project", PX, TARGET, role("VIEWER")));

        verifyNoInteractions(mongoTemplate);
    }

    @Test
    void managerCannotChangeOwner() {
        callerHas(ResourceRef.project(PX), AccessRole.MANAGER);
        when(accessService.resolve(ResourceRef.project(PX), OWNER)).thenReturn(ctx(AccessRole.OWNER));

        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.changeRole("project", PX, OWNER, role("VIEWER")));

        assertEquals(ErrorCode.ACTION_NOT_ALLOWED, e.getErrorCode());
        verifyNoInteractions(mongoTemplate);
    }

    @Test
    void ownerCannotChangeOwnEntry() {
        callerHas(ResourceRef.project(PX), AccessRole.OWNER);
        when(accessService.resolve(ResourceRef.project(PX), OWNER)).thenReturn(ctx(AccessRole.OWNER));

        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.changeRole("project", PX, OWNER, role("MANAGER")));

        assertEquals(ErrorCode.ACTION_NOT_ALLOWED, e.getErrorCode());
        verifyNoInteractions(mongoTemplate);
    }

    @Test
    void projectChangeRoleSetsOnlyNewRoleOnMatchedEntry() {
        callerHas(ResourceRef.project(PX), AccessRole.MANAGER);
        when(accessService.resolve(ResourceRef.project(PX), TARGET)).thenReturn(ctx(AccessRole.EDITOR));

        service.changeRole("project", PX, TARGET, role("COMMENTER"));

        ArgumentCaptor<Query> query = ArgumentCaptor.forClass(Query.class);
        ArgumentCaptor<Update> update = ArgumentCaptor.forClass(Update.class);
        verify(mongoTemplate).updateFirst(query.capture(), update.capture(), eq(ProjectEntity.class));
        assertEquals(TARGET, query.getValue().getQueryObject().get("collaborators.userId"));
        Document set = (Document) update.getValue().getUpdateObject().get("$set");
        assertEquals("COMMENTER", set.get("collaborators.$[c].role"));
        // P6: khong con ghi vai tro cu
        assertEquals(java.util.Set.of("collaborators.$[c].role", "updateBy", "updateByEmail", "updatedAt"), set.keySet());
        assertTrue(update.getValue().hasArrayFilters());
    }

    @Test
    void folderChangeRoleWithoutDirectGrantIsNotFound() {
        callerHas(ResourceRef.folder(F1), AccessRole.MANAGER);
        when(accessService.resolve(ResourceRef.folder(F1), TARGET)).thenReturn(ctx(AccessRole.VIEWER));
        when(mongoTemplate.updateFirst(any(Query.class), any(UpdateDefinition.class), eq(FolderEntity.class)))
                .thenReturn(UpdateResult.acknowledged(0, 0L, null));

        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.changeRole("folder", F1, TARGET, role("COMMENTER")));

        assertEquals(ErrorCode.NOT_FOUND, e.getErrorCode());
    }

    // ---------- xoa ----------

    @Test
    void removeProjectMemberReusesProjectServiceLogic() {
        service.removeGrant("project", PX, TARGET);

        verify(projectService).removeCollaboratorFromProject(PX, TARGET);
        verifyNoInteractions(mongoTemplate);
    }

    @Test
    void removeOtherFolderGrantNeedsManageAccess() {
        when(accessService.require(ResourceRef.folder(F1), Action.MANAGE_ACCESS))
                .thenThrow(new FileBusinessException(ErrorCode.ACTION_NOT_ALLOWED));

        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.removeGrant("folder", F1, TARGET));

        assertEquals(ErrorCode.ACTION_NOT_ALLOWED, e.getErrorCode());
        verifyNoInteractions(mongoTemplate);
    }

    @Test
    void managerCannotRemoveOwnerFolderGrant() {
        callerHas(ResourceRef.folder(F1), AccessRole.MANAGER);
        when(accessService.resolve(ResourceRef.folder(F1), OWNER)).thenReturn(ctx(AccessRole.OWNER));

        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.removeGrant("folder", F1, OWNER));

        assertEquals(ErrorCode.ACTION_NOT_ALLOWED, e.getErrorCode());
        verifyNoInteractions(mongoTemplate);
    }

    @Test
    void selfLeaveFolderPullsOwnGrantsWithoutManageAccess() {
        callerHas(ResourceRef.folder(F1), AccessRole.VIEWER);

        service.removeGrant("folder", F1, CALLER);

        verify(accessService, never()).require(ResourceRef.folder(F1), Action.MANAGE_ACCESS);
        ArgumentCaptor<Update> update = ArgumentCaptor.forClass(Update.class);
        verify(mongoTemplate).updateFirst(any(Query.class), update.capture(), eq(FolderEntity.class));
        Document pull = (Document) update.getValue().getUpdateObject().get("$pull");
        assertEquals(new Document("userId", CALLER), pull.get("grants"));
    }

    // ---------- cai dat ----------

    @Test
    void settingsNeedManageSettings() {
        when(accessService.require(ResourceRef.folder(F1), Action.MANAGE_SETTINGS))
                .thenThrow(new FileBusinessException(ErrorCode.ACTION_NOT_ALLOWED));

        assertThrows(FileBusinessException.class,
                () -> service.updateSettings("folder", F1, new AccessSettingsRequestDTO()));

        verifyNoInteractions(mongoTemplate);
    }

    @Test
    void folderSettingsNullUnsetsAndProjectNullIsBadRequest() {
        callerHas(ResourceRef.folder(F1), AccessRole.MANAGER);
        callerHas(ResourceRef.project(PX), AccessRole.MANAGER);

        service.updateSettings("folder", F1, new AccessSettingsRequestDTO());
        UserBusinessException e = assertThrows(UserBusinessException.class,
                () -> service.updateSettings("project", PX, new AccessSettingsRequestDTO()));

        assertEquals(ErrorCode.BAD_REQUEST, e.getErrorCode());
        ArgumentCaptor<Update> update = ArgumentCaptor.forClass(Update.class);
        verify(mongoTemplate).updateFirst(any(Query.class), update.capture(), eq(FolderEntity.class));
        Document unset = (Document) update.getValue().getUpdateObject().get("$unset");
        assertTrue(unset.containsKey("settings.viewersCanDownload"));
    }

    // ---------- link + join (T15) ----------

    private static final String TOKEN = "tok-cu";

    private FolderEntity linkedFolder(AccessRole linkRole, Instant expiresAt) {
        FolderEntity f = FolderEntity.builder().folderId(F1).projectId(PX).folderName("F1")
                .link(LinkAccess.builder().token(TOKEN).role(linkRole).allowProofSelection(true)
                        .expiresAt(expiresAt).createdBy(OWNER).createdAt(Instant.now()).build())
                .build();
        f.setIsActive(true);
        f.setIsTrash(false);
        return f;
    }

    private static AccessContext ctxStatus(AccessRole own, ProjectStatus status) {
        return new AccessContext(own, null, own, null, true, status, false, List.of());
    }

    private static LinkRequestDTO link(Boolean enabled, String role, Boolean regenerate) {
        LinkRequestDTO dto = new LinkRequestDTO();
        dto.setEnabled(enabled);
        dto.setRole(role);
        dto.setRegenerate(regenerate);
        return dto;
    }

    @Test
    void joinExpiredLinkIsLinkExpiredGone() {
        when(folderRepo.findByLinkToken(TOKEN))
                .thenReturn(Optional.of(linkedFolder(AccessRole.COMMENTER, Instant.now().minus(1, ChronoUnit.HOURS))));

        FileBusinessException e = assertThrows(FileBusinessException.class, () -> service.joinLink(TOKEN));

        assertEquals(ErrorCode.LINK_EXPIRED, e.getErrorCode());
        assertEquals(HttpStatus.GONE, ErrorCode.LINK_EXPIRED.getHttpStatus());
        verifyNoInteractions(mongoTemplate);
    }

    @Test
    void joinProofOnlyOrUnknownLinkIsInvalid() {
        when(folderRepo.findByLinkToken(TOKEN)).thenReturn(Optional.of(linkedFolder(null, null)));
        when(folderRepo.findByLinkToken("la")).thenReturn(Optional.empty());

        FileBusinessException e = assertThrows(FileBusinessException.class, () -> service.joinLink(TOKEN));
        FileBusinessException e2 = assertThrows(FileBusinessException.class, () -> service.joinLink("la"));

        assertEquals(ErrorCode.PROOF_LINK_INVALID, e.getErrorCode());
        assertEquals(ErrorCode.PROOF_LINK_INVALID, e2.getErrorCode());
        verifyNoInteractions(mongoTemplate);
    }

    @Test
    void joinArchivedProjectIsInvalid() {
        when(folderRepo.findByLinkToken(TOKEN)).thenReturn(Optional.of(linkedFolder(AccessRole.COMMENTER, null)));
        when(accessService.resolve(ResourceRef.folder(F1))).thenReturn(ctxStatus(null, ProjectStatus.ARCHIVED));

        FileBusinessException e = assertThrows(FileBusinessException.class, () -> service.joinLink(TOKEN));

        assertEquals(ErrorCode.PROOF_LINK_INVALID, e.getErrorCode());
        verifyNoInteractions(mongoTemplate);
    }

    @Test
    void joinWithOwnRoleWritesNothing() {
        when(folderRepo.findByLinkToken(TOKEN)).thenReturn(Optional.of(linkedFolder(AccessRole.COMMENTER, null)));
        when(accessService.resolve(ResourceRef.folder(F1))).thenReturn(ctxStatus(AccessRole.VIEWER, ProjectStatus.ACTIVE));

        JoinLinkResponseDTO res = service.joinLink(TOKEN);

        assertEquals(PX, res.getProjectId());
        assertEquals(F1, res.getFolderId());
        verifyNoInteractions(mongoTemplate);
    }

    @Test
    void joinPushesViaLinkGrantOnlyWhenAbsentAndTokenUnchanged() {
        when(folderRepo.findByLinkToken(TOKEN)).thenReturn(Optional.of(linkedFolder(AccessRole.COMMENTER, null)));
        when(accessService.resolve(ResourceRef.folder(F1))).thenReturn(ctxStatus(null, ProjectStatus.ACTIVE));

        service.joinLink(TOKEN);

        ArgumentCaptor<Query> query = ArgumentCaptor.forClass(Query.class);
        ArgumentCaptor<Update> update = ArgumentCaptor.forClass(Update.class);
        verify(mongoTemplate).updateFirst(query.capture(), update.capture(), eq(FolderEntity.class));
        Document q = query.getValue().getQueryObject();
        assertEquals(F1, q.get("_id"));
        assertEquals(new Document("$ne", CALLER), q.get("grants.userId"));
        assertEquals(TOKEN, q.get("link.token"));
        AccessGrant grant = (AccessGrant) ((Document) update.getValue().getUpdateObject().get("$push")).get("grants");
        assertEquals(CALLER, grant.getUserId());
        assertEquals(Boolean.TRUE, grant.getViaLink());
        assertNull(grant.getRole());
        assertEquals(OWNER, grant.getGrantedBy());
    }

    @Test
    void updateLinkNeedsManageAccess() {
        when(accessService.require(ResourceRef.folder(F1), Action.MANAGE_ACCESS))
                .thenThrow(new FileBusinessException(ErrorCode.ACTION_NOT_ALLOWED));

        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.updateLink(F1, link(true, "COMMENTER", null)));

        assertEquals(ErrorCode.ACTION_NOT_ALLOWED, e.getErrorCode());
        verifyNoInteractions(mongoTemplate);
    }

    @Test
    void linkRoleEditorIsBadRequest() {
        callerHas(ResourceRef.folder(F1), AccessRole.MANAGER);
        when(folderRepo.findById(F1)).thenReturn(Optional.of(linkedFolder(AccessRole.COMMENTER, null)));

        UserBusinessException e = assertThrows(UserBusinessException.class,
                () -> service.updateLink(F1, link(true, "EDITOR", null)));

        assertEquals(ErrorCode.BAD_REQUEST, e.getErrorCode());
        verifyNoInteractions(mongoTemplate);
    }

    @Test
    void disableLinkUnsetsLinkAndPullsViaLinkInOneUpdate() {
        callerHas(ResourceRef.folder(F1), AccessRole.MANAGER);
        when(folderRepo.findById(F1)).thenReturn(Optional.of(linkedFolder(AccessRole.COMMENTER, null)));

        LinkSettingsDTO res = service.updateLink(F1, link(false, null, null));

        assertFalse(res.isEnabled());
        assertNull(res.getToken());
        ArgumentCaptor<Update> update = ArgumentCaptor.forClass(Update.class);
        verify(mongoTemplate, times(1)).updateFirst(any(Query.class), update.capture(), eq(FolderEntity.class));
        Document u = update.getValue().getUpdateObject();
        // P6: chi go link, khong con truong proof cu
        assertEquals(java.util.Set.of("link"), ((Document) u.get("$unset")).keySet());
        assertEquals(new Document("viaLink", true), ((Document) u.get("$pull")).get("grants"));
    }

    @Test
    void regenerateIssuesNewTokenAndPullsViaLinkInSameUpdate() {
        callerHas(ResourceRef.folder(F1), AccessRole.MANAGER);
        when(folderRepo.findById(F1)).thenReturn(Optional.of(linkedFolder(AccessRole.COMMENTER, null)));

        LinkSettingsDTO res = service.updateLink(F1, link(true, "COMMENTER", true));

        assertTrue(res.isEnabled());
        assertNotEquals(TOKEN, res.getToken());
        assertEquals(43, res.getToken().length());
        ArgumentCaptor<Update> update = ArgumentCaptor.forClass(Update.class);
        verify(mongoTemplate, times(1)).updateFirst(any(Query.class), update.capture(), eq(FolderEntity.class));
        Document u = update.getValue().getUpdateObject();
        LinkAccess saved = (LinkAccess) ((Document) u.get("$set")).get("link");
        assertEquals(res.getToken(), saved.getToken());
        assertEquals(AccessRole.COMMENTER, saved.getRole());
        assertFalse(((Document) u.get("$set")).containsKey("shareToken"));
        assertNull(u.get("$unset"));
        assertEquals(new Document("viaLink", true), ((Document) u.get("$pull")).get("grants"));
    }

    @Test
    void lowerLinkRoleKeepsTokenAndViaLinkGrants() {
        callerHas(ResourceRef.folder(F1), AccessRole.MANAGER);
        when(folderRepo.findById(F1)).thenReturn(Optional.of(linkedFolder(AccessRole.COMMENTER, null)));

        LinkSettingsDTO res = service.updateLink(F1, link(true, "VIEWER", null));

        assertEquals(TOKEN, res.getToken());
        assertEquals(AccessRole.VIEWER, res.getRole());
        ArgumentCaptor<Update> update = ArgumentCaptor.forClass(Update.class);
        verify(mongoTemplate).updateFirst(any(Query.class), update.capture(), eq(FolderEntity.class));
        assertNull(update.getValue().getUpdateObject().get("$pull"));
    }
}
