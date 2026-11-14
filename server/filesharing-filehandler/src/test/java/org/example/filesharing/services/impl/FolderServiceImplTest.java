package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.PageRequestDto;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.entity.models.access.AccessGrant;
import com.file.service.filesharing.core.entity.models.access.LinkAccess;
import com.file.service.filesharing.core.enums.ProjectStatus;
import com.file.service.filesharing.core.enums.access.AccessRole;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import com.file.service.filesharing.core.exceptions.specException.UserBusinessException;
import org.example.filesharing.entities.dtos.folder.FolderDetailDTO;
import org.example.filesharing.entities.dtos.folder.FolderFilterRequestDTO;
import org.example.filesharing.entities.dtos.folder.FolderListItemDTO;
import org.example.filesharing.entities.dtos.folder.FolderTreeItemDTO;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.repositories.FolderRepo;
import org.example.filesharing.repositories.ProjectRepo;
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
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/** Doc cay folder theo AccessService: loc theo quyen, goc truy cap cua khach len lam goc cay. */
class FolderServiceImplTest {

    private static final String PX = "px";

    private static final String ME = "u-guest";

    private FolderRepo folderRepo;
    private AccessService accessService;
    private AuditService auditService;
    private ProjectEntity project;
    private MongoTemplate mongoTemplate;
    private FolderServiceImpl service;
    private FolderEntity f1;
    private FolderEntity f1a;
    private FolderEntity f2;

    @BeforeEach
    void setUp() {
        folderRepo = mock(FolderRepo.class);
        ProjectRepo projectRepo = mock(ProjectRepo.class);
        accessService = mock(AccessService.class);
        mongoTemplate = mock(MongoTemplate.class);
        auditService = mock(AuditService.class);
        service = new FolderServiceImpl(folderRepo, projectRepo, mock(AssetRepo.class), mongoTemplate,
                auditService, mock(AuditLogService.class), accessService);
        when(auditService.getCurrentUserId()).thenReturn(ME);
        when(auditService.getCurrentUser()).thenReturn(UserEntity.builder().userId(ME).build());

        project = ProjectEntity.builder().projectId(PX).ownerId("u-owner").status(ProjectStatus.ACTIVE).build();
        project.setIsActive(true);
        when(projectRepo.findById(PX)).thenReturn(Optional.of(project));

        f1 = folder("f1", null);
        f1a = folder("f1a", "f1");
        f2 = folder("f2", null);
        when(folderRepo.findByProjectId(PX)).thenReturn(new ArrayList<>(List.of(f1, f1a, f2)));
    }

    private static FolderEntity folder(String id, String parentId) {
        FolderEntity f = FolderEntity.builder().folderId(id).projectId(PX).parentFolderId(parentId).folderName(id).build();
        f.setIsActive(true);
        f.setIsTrash(false);
        return f;
    }

    @Test
    void guestSeesAccessRootAsTreeRoot() {
        when(accessService.filterVisible(any(), any())).thenReturn(List.of(f1a));

        List<FolderTreeItemDTO> tree = service.getFolderTree(PX).getTree();

        assertEquals(1, tree.size());
        assertEquals("f1a", tree.get(0).getFolderId());
        verify(accessService, never()).require(any(), any());
    }

    @Test
    void memberSeesWholeTree() {
        when(accessService.filterVisible(any(), any())).thenReturn(List.of(f1, f1a, f2));

        List<FolderTreeItemDTO> tree = service.getFolderTree(PX).getTree();

        assertEquals(List.of("f1", "f2"), tree.stream().map(FolderTreeItemDTO::getFolderId).toList());
        assertEquals("f1a", tree.get(0).getChildren().get(0).getFolderId());
    }

    @Test
    void unrelatedUserGetsAccessDeniedInsteadOfEmptyTree() {
        when(accessService.filterVisible(any(), any())).thenReturn(List.of());
        when(accessService.require(ResourceRef.project(PX), Action.VIEW))
                .thenThrow(new FileBusinessException(ErrorCode.ACCESS_DENIED));

        FileBusinessException e = assertThrows(FileBusinessException.class, () -> service.getFolderTree(PX));
        assertEquals(ErrorCode.ACCESS_DENIED, e.getErrorCode());
    }

    // ---------- myAccess / myRole (T17) ----------

    @Test
    void treeNodesCarryMyRoleAndBadgeFlags() {
        f1.setLink(LinkAccess.builder().token("tk").role(AccessRole.VIEWER).build());
        f1.setGrants(List.of(AccessGrant.builder().userId(ME).role(AccessRole.COMMENTER).build()));
        f1a.setGrants(List.of(AccessGrant.builder().userId("u-x").viaLink(true).build()));
        when(accessService.filterVisible(any(), any())).thenReturn(List.of(f1, f1a));

        FolderTreeItemDTO root = service.getFolderTree(PX).getTree().get(0);
        FolderTreeItemDTO child = root.getChildren().get(0);

        assertEquals(AccessRole.COMMENTER, root.getMyRole());
        assertTrue(root.isHasLink());
        assertTrue(root.isHasDirectGrants());
        // con ke thua vai tro cha, grant viaLink khong tinh la grant truc tiep
        assertEquals(AccessRole.COMMENTER, child.getMyRole());
        assertFalse(child.isHasLink());
        assertFalse(child.isHasDirectGrants());
    }

    @Test
    void folderByIdReturnsMyAccessWithCapabilities() {
        f1.setGrants(List.of(AccessGrant.builder().userId(ME).role(AccessRole.COMMENTER).build()));
        when(folderRepo.findById("f1")).thenReturn(Optional.of(f1));
        when(accessService.require(ResourceRef.folder("f1"), Action.VIEW)).thenReturn(new AccessContext(
                AccessRole.COMMENTER, null, AccessRole.COMMENTER, null, true, ProjectStatus.ACTIVE, false,
                List.of(new AccessContext.Source(AccessContext.SourceType.FOLDER, AccessRole.COMMENTER, "f1"))));

        FolderDetailDTO dto = service.getFolderById("f1");

        assertEquals("f1", dto.getFolderId());
        assertEquals(AccessRole.COMMENTER, dto.getMyAccess().getRole());
        assertTrue(dto.getMyAccess().getCapabilities().contains(Action.COMMENT));
        assertFalse(dto.getMyAccess().getCapabilities().contains(Action.UPLOAD));
        assertTrue(dto.isHasDirectGrants());
    }

    @Test
    void rootFolderPageItemsCarryMyRole() {
        f1.setGrants(List.of(AccessGrant.builder().userId(ME).role(AccessRole.COMMENTER).build()));
        f1.setLink(LinkAccess.builder().token("tk").build());
        when(mongoTemplate.find(any(Query.class), eq(FolderEntity.class))).thenReturn(List.of(f1, f2));
        when(accessService.filterVisible(any(), any())).thenReturn(List.of(f1));
        PageRequestDto<FolderFilterRequestDTO> page = new PageRequestDto<>();
        FolderFilterRequestDTO filter = new FolderFilterRequestDTO();
        filter.setProjectId(PX);
        page.setFilter(filter);

        List<FolderListItemDTO> items = service.getFolderPage(page).getData();

        assertEquals(1, items.size());
        assertEquals(AccessRole.COMMENTER, items.get(0).getMyRole());
        assertTrue(items.get(0).isHasLink());
    }

    @Test
    void restoreFolderWhileAncestorInTrashIsBadRequestAndWritesNothing() {
        f1a.setIsTrash(true);
        f1a.setAncestorIds(List.of("f1"));
        when(folderRepo.findById("f1a")).thenReturn(Optional.of(f1a));
        when(mongoTemplate.exists(any(Query.class), eq(FolderEntity.class))).thenReturn(true);

        UserBusinessException e = assertThrows(UserBusinessException.class, () -> service.restoreFolder("f1a"));

        assertEquals(ErrorCode.BAD_REQUEST, e.getErrorCode());
        verify(accessService).require(ResourceRef.folder("f1a"), Action.TRASH);
        verify(mongoTemplate, never()).updateMulti(any(Query.class), any(UpdateDefinition.class), eq(FolderEntity.class));
        verify(folderRepo, never()).saveAll(any());
    }

    // ---------- T21: response khong con token va snapshot quyen cu ----------

    @Test
    void folderResponsesCarryNoTokenOrOldPermissionFields() throws Exception {
        // owner: code cu khong che token voi owner; P6 da xoa truong cu, token chi con trong link
        project.setOwnerId(ME);
        f1.setLink(LinkAccess.builder().token("tok-secret").role(AccessRole.VIEWER).build());
        when(folderRepo.findById("f1")).thenReturn(Optional.of(f1));
        when(accessService.require(ResourceRef.folder("f1"), Action.VIEW)).thenReturn(new AccessContext(
                AccessRole.OWNER, null, AccessRole.OWNER, null, true, ProjectStatus.ACTIVE, false, List.of()));
        when(mongoTemplate.find(any(Query.class), eq(FolderEntity.class))).thenReturn(List.of(f1));
        when(accessService.filterVisible(any(), any())).thenReturn(List.of(f1));
        PageRequestDto<FolderFilterRequestDTO> page = new PageRequestDto<>();
        FolderFilterRequestDTO filter = new FolderFilterRequestDTO();
        filter.setProjectId(PX);
        page.setFilter(filter);

        com.fasterxml.jackson.databind.ObjectMapper json = new com.fasterxml.jackson.databind.ObjectMapper().findAndRegisterModules();
        // entity: create-new, update-detail, restore-from-trash tra thang FolderEntity
        for (Object body : List.of(service.getFolderById("f1"), service.getFolderPage(page), service.getFolderTree(PX), f1)) {
            String s = json.writeValueAsString(body);
            for (String banned : List.of("tok-secret", "shareToken", "shareExpiry", "shareCreatedBy", "userPermissions", "\"visibility\"")) {
                assertFalse(s.contains(banned), banned + " in " + s);
            }
        }
    }
}
