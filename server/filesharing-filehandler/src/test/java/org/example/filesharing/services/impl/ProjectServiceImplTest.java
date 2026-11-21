package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.entity.models.project.ProjectCollaborator;
import com.file.service.filesharing.core.enums.ProjectStatus;
import com.file.service.filesharing.core.enums.access.AccessRole;
import com.file.service.filesharing.core.enums.auth.UserGrantedRole;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import com.file.service.filesharing.core.exceptions.specException.UserBusinessException;
import org.example.filesharing.entities.dtos.access.MyAccessDTO;
import org.example.filesharing.entities.dtos.folder.FolderBreadcrumbItemDTO;
import org.example.filesharing.entities.dtos.project.ProjectCollaboratorDTO;
import org.example.filesharing.entities.dtos.project.ProjectCreateUpdateDTO;
import org.example.filesharing.entities.dtos.project.ProjectDetailDTO;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.repositories.ReviewSessionRepo;
import org.example.filesharing.repositories.UserRepo;
import org.example.filesharing.services.AccessService;
import org.example.filesharing.services.AuditLogService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.utils.access.AccessContext;
import org.example.filesharing.utils.access.Action;
import org.example.filesharing.utils.access.ResourceRef;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.UpdateDefinition;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Project service kiem quyen qua AccessService, khong admin bypass (T12). */
class ProjectServiceImplTest {

    private static final String PX = "px";
    private static final String OWNER = "u1";
    private static final String MANAGER = "u3";
    private static final String MEMBER = "u2";

    private AccessService accessService;
    private AuditService auditService;
    private MongoTemplate mongoTemplate;
    private ProjectRepo projectRepo;
    private UserRepo userRepo;
    private ProjectServiceImpl service;
    private ProjectEntity project;

    @BeforeEach
    void setUp() {
        projectRepo = mock(ProjectRepo.class);
        userRepo = mock(UserRepo.class);
        accessService = mock(AccessService.class);
        auditService = mock(AuditService.class);
        mongoTemplate = mock(MongoTemplate.class);
        service = new ProjectServiceImpl(projectRepo, userRepo, mock(ReviewSessionRepo.class),
                mongoTemplate, auditService, mock(AuditLogService.class), accessService);

        project = ProjectEntity.builder().projectId(PX).ownerId(OWNER).status(ProjectStatus.ACTIVE)
                .collaborators(new ArrayList<>(List.of(
                        collaborator(OWNER, AccessRole.MANAGER),
                        collaborator(MANAGER, AccessRole.MANAGER),
                        collaborator(MEMBER, AccessRole.EDITOR))))
                .build();
        project.setIsActive(true);
        when(projectRepo.findById(PX)).thenReturn(Optional.of(project));
    }

    private static ProjectCollaborator collaborator(String userId, AccessRole role) {
        return ProjectCollaborator.builder().userId(userId).role(role).build();
    }

    private void loginAs(String userId, UserGrantedRole... roles) {
        UserEntity user = UserEntity.builder().userId(userId).userGrantedRoles(new ArrayList<>(List.of(roles))).build();
        when(auditService.getCurrentUser()).thenReturn(user);
        when(auditService.getCurrentUserId()).thenReturn(userId);
    }

    private static AccessContext ctx(AccessRole own) {
        return new AccessContext(own, null, own, null, true, ProjectStatus.ACTIVE, false, List.of());
    }

    private static MyAccessDTO noAccess() {
        return MyAccessDTO.builder().capabilities(List.of()).sources(List.of()).build();
    }

    private static FileBusinessException denied() {
        return new FileBusinessException(ErrorCode.ACCESS_DENIED);
    }

    @Test
    void adminWithoutRoleIsDeniedOnGetById() {
        loginAs("admin", UserGrantedRole.ROLE_SA);
        when(accessService.myAccess(ResourceRef.project(PX))).thenReturn(noAccess());
        when(accessService.require(ResourceRef.project(PX), Action.VIEW)).thenThrow(denied());

        FileBusinessException e = assertThrows(FileBusinessException.class, () -> service.getProjectById(PX));

        assertEquals(ErrorCode.ACCESS_DENIED, e.getErrorCode());
    }

    @Test
    void memberGetsFullProjectWithMyAccess() {
        loginAs(MEMBER);
        MyAccessDTO my = MyAccessDTO.builder().role(AccessRole.EDITOR).ownRole(AccessRole.EDITOR)
                .capabilities(List.of(Action.VIEW, Action.UPLOAD)).sources(List.of()).build();
        when(accessService.myAccess(ResourceRef.project(PX))).thenReturn(my);

        ProjectDetailDTO dto = service.getProjectById(PX);

        assertEquals(OWNER, dto.getOwnerId());
        assertEquals(3, dto.getCollaborators().size());
        assertSame(my, dto.getMyAccess());
        assertNull(dto.getAccessRoots());
        verify(mongoTemplate, never()).find(any(Query.class), eq(FolderEntity.class));
    }

    @Test
    void projectResponsesCarryNoTokenOrVisibility() throws Exception {
        // P6 da xoa truong cu khoi ProjectEntity; giu kiem response khong co lai cac khoa nay
        loginAs(OWNER);
        when(accessService.myAccess(ResourceRef.project(PX))).thenReturn(MyAccessDTO.builder()
                .role(AccessRole.OWNER).ownRole(AccessRole.OWNER).capabilities(List.of(Action.VIEW)).sources(List.of()).build());

        com.fasterxml.jackson.databind.ObjectMapper json = new com.fasterxml.jackson.databind.ObjectMapper().findAndRegisterModules();
        // entity: get-page, create-new, update-detail, status... tra thang ProjectEntity
        for (Object body : List.of(service.getProjectById(PX), project)) {
            String s = json.writeValueAsString(body);
            for (String banned : List.of("shareToken", "shareExpiry", "\"visibility\"", "projectRole", "projectPermissions")) {
                org.junit.jupiter.api.Assertions.assertFalse(s.contains(banned), banned + " in " + s);
            }
        }
    }

    @Test
    void folderOnlyGuestGetsReducedProjectWithAccessRoots() {
        loginAs("u-guest");
        project.setProjectName("PX-ws2");
        when(accessService.myAccess(ResourceRef.project(PX))).thenReturn(noAccess());
        FolderEntity f1 = FolderEntity.builder().folderId("f1").projectId(PX).folderName("Gui khach").level(1).build();
        FolderEntity f1a = FolderEntity.builder().folderId("f1a").projectId(PX).parentFolderId("f1").folderName("F1a").build();
        List<FolderEntity> folders = List.of(f1, f1a);
        when(mongoTemplate.find(any(Query.class), eq(FolderEntity.class))).thenReturn(folders);
        when(accessService.filterVisible(project, folders)).thenReturn(folders);

        ProjectDetailDTO dto = service.getProjectById(PX);

        assertEquals("PX-ws2", dto.getProjectName());
        assertEquals(ProjectStatus.ACTIVE, dto.getStatus());
        assertNull(dto.getMyAccess().getRole());
        assertEquals(List.of("f1"), dto.getAccessRoots().stream().map(FolderBreadcrumbItemDTO::getFolderId).toList());
        assertEquals("Gui khach", dto.getAccessRoots().get(0).getFolderName());
        assertNull(dto.getCollaborators());
        assertNull(dto.getOwnerId());
        verify(accessService, never()).require(any(), any());
    }

    @Test
    void statusTransitionPicksActionByArchived() {
        loginAs(MANAGER);
        when(accessService.require(any(), any())).thenThrow(denied());

        assertThrows(FileBusinessException.class, () -> service.updateProjectStatus(PX, ProjectStatus.COMPLETED));
        verify(accessService).require(ResourceRef.project(PX), Action.MANAGE_PROJECT);

        assertThrows(FileBusinessException.class, () -> service.updateProjectStatus(PX, ProjectStatus.ARCHIVED));
        verify(accessService).require(ResourceRef.project(PX), Action.ARCHIVE_PROJECT);

        project.setStatus(ProjectStatus.ARCHIVED);
        clearInvocations(accessService);
        assertThrows(FileBusinessException.class, () -> service.updateProjectStatus(PX, ProjectStatus.ACTIVE));
        verify(accessService).require(ResourceRef.project(PX), Action.ARCHIVE_PROJECT);
        verify(mongoTemplate, never()).updateFirst(any(Query.class), any(UpdateDefinition.class), eq(ProjectEntity.class));
    }

    @Test
    void updateDetailWithCollaboratorsIsBadRequest() {
        // thanh vien chi doi qua /api/access (design 6.2)
        loginAs(OWNER);
        when(accessService.require(any(), any())).thenReturn(ctx(AccessRole.OWNER));
        ProjectCreateUpdateDTO dto = new ProjectCreateUpdateDTO();
        dto.setProjectId(PX);
        dto.setCollaborators(List.of());

        UserBusinessException e = assertThrows(UserBusinessException.class, () -> service.updateProjectDetail(dto));

        assertEquals(ErrorCode.BAD_REQUEST, e.getErrorCode());
        verifyNoInteractions(mongoTemplate);
    }

    @Test
    void managerCannotRemoveOwnerEntry() {
        loginAs(MANAGER);
        when(accessService.require(ResourceRef.project(PX), Action.MANAGE_ACCESS)).thenReturn(ctx(AccessRole.MANAGER));

        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.removeCollaboratorFromProject(PX, OWNER));

        assertEquals(ErrorCode.ACTION_NOT_ALLOWED, e.getErrorCode());
        verifyNoInteractions(mongoTemplate);
    }

    // ---------- P6: tao project kem thanh vien dung thang AccessRole ----------

    private static ProjectCreateUpdateDTO createWith(String userId, String role) {
        ProjectCollaboratorDTO c = new ProjectCollaboratorDTO();
        c.setUserId(userId);
        c.setRole(role);
        ProjectCreateUpdateDTO dto = new ProjectCreateUpdateDTO();
        dto.setProjectName("p-new");
        dto.setCollaborators(List.of(c));
        return dto;
    }

    @Test
    void createRejectsRoleOutsideProjectScale() {
        loginAs(OWNER);

        UserBusinessException restricted = assertThrows(UserBusinessException.class,
                () -> service.createNewProject(createWith(MEMBER, "RESTRICTED")));
        UserBusinessException legacy = assertThrows(UserBusinessException.class,
                () -> service.createNewProject(createWith(MEMBER, "PRODUCER")));
        FileBusinessException owner = assertThrows(FileBusinessException.class,
                () -> service.createNewProject(createWith(MEMBER, "OWNER")));

        assertEquals(ErrorCode.BAD_REQUEST, restricted.getErrorCode());
        assertEquals(ErrorCode.BAD_REQUEST, legacy.getErrorCode());
        assertEquals(ErrorCode.ACTION_NOT_ALLOWED, owner.getErrorCode());
        verify(projectRepo, never()).save(any());
    }

    @Test
    void createStoresAccessRoleAndOwnerEntryAsManager() {
        loginAs(OWNER);
        // buildAudit cua lop cha dung field @Autowired rieng
        org.springframework.test.util.ReflectionTestUtils.setField(service,
                org.example.filesharing.services.baseService.BaseAuditService.class, "auditService", auditService,
                AuditService.class);
        when(userRepo.findById(MEMBER)).thenReturn(Optional.of(UserEntity.builder().userId(MEMBER).build()));
        when(projectRepo.save(any(ProjectEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        ProjectEntity saved = service.createNewProject(createWith(MEMBER, "COMMENTER"));

        assertEquals(2, saved.getCollaborators().size());
        assertEquals(OWNER, saved.getCollaborators().get(0).getUserId());
        assertEquals(AccessRole.MANAGER, saved.getCollaborators().get(0).getRole());
        assertEquals(MEMBER, saved.getCollaborators().get(1).getUserId());
        assertEquals(AccessRole.COMMENTER, saved.getCollaborators().get(1).getRole());
        assertEquals(Boolean.TRUE, saved.getSettings().getViewersCanDownload());
    }

    @Test
    void removingOtherNeedsManageAccessAndWritesNothingWhenDenied() {
        loginAs(MEMBER);
        when(accessService.require(ResourceRef.project(PX), Action.MANAGE_ACCESS)).thenThrow(
                new FileBusinessException(ErrorCode.ACTION_NOT_ALLOWED));

        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.removeCollaboratorFromProject(PX, MANAGER));

        assertEquals(ErrorCode.ACTION_NOT_ALLOWED, e.getErrorCode());
        verifyNoInteractions(mongoTemplate);
    }

    @Test
    void nonMemberLeavingIsAccessDenied() {
        loginAs("u4", UserGrantedRole.ROLE_SA);

        FileBusinessException e = assertThrows(FileBusinessException.class, () -> service.leaveProject(PX));

        assertEquals(ErrorCode.ACCESS_DENIED, e.getErrorCode());
        verifyNoInteractions(mongoTemplate);
    }
}
