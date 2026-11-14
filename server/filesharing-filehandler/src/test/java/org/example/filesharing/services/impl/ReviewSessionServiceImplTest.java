package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.AssetEntity;
import com.file.service.filesharing.core.entity.models.MetadataEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.entity.models.ReviewSessionEntity;
import com.file.service.filesharing.core.entity.models.review.ReviewerInfo;
import com.file.service.filesharing.core.enums.ProjectStatus;
import com.file.service.filesharing.core.enums.ReviewSessionStatus;
import com.file.service.filesharing.core.enums.access.AccessRole;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import com.file.service.filesharing.core.exceptions.specException.UserBusinessException;
import org.example.filesharing.entities.dtos.review.ReviewSessionCreateDTO;
import org.example.filesharing.entities.dtos.review.ReviewSessionDecisionDTO;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.repositories.ReviewSessionRepo;
import org.example.filesharing.repositories.UserRepo;
import org.example.filesharing.services.AccessService;
import org.example.filesharing.services.AuditLogService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.baseService.BaseAuditService;
import org.example.filesharing.utils.access.AccessContext;
import org.example.filesharing.utils.access.Action;
import org.example.filesharing.utils.access.ResourceRef;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Duyet tinh lai quyen luc duyet, mat quyen thi session khong doi (AC-6, T13); chi dinh khach >= COMMENTER (T17). */
class ReviewSessionServiceImplTest {

    private ReviewSessionRepo reviewSessionRepo;
    private ProjectRepo projectRepo;
    private AssetRepo assetRepo;
    private MetadataRepo metadataRepo;
    private UserRepo userRepo;
    private AccessService accessService;
    private AuditService auditService;
    private ReviewSessionServiceImpl service;
    private ReviewSessionEntity session;

    @BeforeEach
    void setUp() throws Exception {
        reviewSessionRepo = mock(ReviewSessionRepo.class);
        projectRepo = mock(ProjectRepo.class);
        assetRepo = mock(AssetRepo.class);
        metadataRepo = mock(MetadataRepo.class);
        userRepo = mock(UserRepo.class);
        accessService = mock(AccessService.class);
        auditService = mock(AuditService.class);
        service = new ReviewSessionServiceImpl(reviewSessionRepo, projectRepo, assetRepo,
                metadataRepo, userRepo, auditService, mock(AuditLogService.class), accessService);
        // BaseAuditService dung field @Autowired rieng
        Field baseAudit = BaseAuditService.class.getDeclaredField("auditService");
        baseAudit.setAccessible(true);
        baseAudit.set(service, auditService);

        session = ReviewSessionEntity.builder().reviewSessionId("rs1").assetId("a1")
                .status(ReviewSessionStatus.IN_REVIEW)
                .reviewers(List.of(ReviewerInfo.builder().userId("u3").build()))
                .build();
        when(reviewSessionRepo.findByReviewSessionIdAndIsActiveTrue("rs1")).thenReturn(Optional.of(session));
    }

    private static AccessContext ctx(AccessRole role) {
        return new AccessContext(role, null, role, null, true, ProjectStatus.ACTIVE, false, List.of());
    }

    // khach u3 khong la thanh vien project, chi co vai tro tai asset qua grant folder
    private ReviewSessionCreateDTO createFor(String reviewerId) {
        ProjectEntity project = ProjectEntity.builder().projectId("px").ownerId("u1").collaborators(List.of()).build();
        project.setIsActive(true);
        when(projectRepo.findById("px")).thenReturn(Optional.of(project));
        AssetEntity asset = AssetEntity.builder().assetId("a1").projectId("px").folderId("f1").build();
        asset.setIsActive(true);
        when(assetRepo.findById("a1")).thenReturn(Optional.of(asset));
        MetadataEntity version = MetadataEntity.builder().assetId("a1").versionNumber(1).build();
        version.setIsActive(true);
        when(metadataRepo.findByAssetIdAndVersionNumber("a1", 1)).thenReturn(Optional.of(version));
        when(userRepo.findAllById(any())).thenReturn(List.of(UserEntity.builder().userId(reviewerId).email(reviewerId + "@t").build()));
        when(reviewSessionRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(auditService.getCurrentUserId()).thenReturn("u1");
        ReviewSessionCreateDTO dto = new ReviewSessionCreateDTO();
        dto.setProjectId("px");
        dto.setAssetId("a1");
        dto.setVersionNumber(1);
        dto.setReviewerIds(List.of(reviewerId));
        return dto;
    }

    @Test
    void guestWithCommenterRoleCanBeAssignedReviewer() {
        ReviewSessionCreateDTO dto = createFor("u3");
        when(accessService.resolve(ResourceRef.asset("a1"), "u3")).thenReturn(ctx(AccessRole.COMMENTER));

        ReviewSessionEntity created = service.createReviewSession(dto);

        assertEquals(List.of("u3"), created.getReviewers().stream().map(ReviewerInfo::getUserId).toList());
        verify(accessService).require(ResourceRef.asset("a1"), Action.CREATE_REVIEW);
    }

    @Test
    void reviewerBelowCommenterIsBadRequest() {
        ReviewSessionCreateDTO dto = createFor("u4");
        when(accessService.resolve(ResourceRef.asset("a1"), "u4")).thenReturn(ctx(AccessRole.VIEWER));
        assertEquals(ErrorCode.BAD_REQUEST,
                assertThrows(UserBusinessException.class, () -> service.createReviewSession(dto)).getErrorCode());

        when(accessService.resolve(ResourceRef.asset("a1"), "u4")).thenReturn(ctx(null));
        assertEquals(ErrorCode.BAD_REQUEST,
                assertThrows(UserBusinessException.class, () -> service.createReviewSession(dto)).getErrorCode());
        verify(reviewSessionRepo, never()).save(any());
    }

    private static ReviewSessionDecisionDTO approve() {
        ReviewSessionDecisionDTO dto = new ReviewSessionDecisionDTO();
        dto.setDecision(ReviewSessionStatus.APPROVED);
        return dto;
    }

    @Test
    void reviewerWhoLostAccessIsDeniedAndSessionUnchanged() {
        when(auditService.getCurrentUserId()).thenReturn("u3");
        when(accessService.require(ResourceRef.asset("a1"), Action.REVIEW_DECIDE))
                .thenThrow(new FileBusinessException(ErrorCode.ACCESS_DENIED));

        FileBusinessException e = assertThrows(FileBusinessException.class, () -> service.submitDecision("rs1", approve()));

        assertEquals(ErrorCode.ACCESS_DENIED, e.getErrorCode());
        assertEquals(ReviewSessionStatus.IN_REVIEW, session.getStatus());
        verify(reviewSessionRepo, never()).save(any());
    }

    @Test
    void notAssignedUserWithRoleIsNotAllowed() {
        when(auditService.getCurrentUserId()).thenReturn("u2");
        when(accessService.require(ResourceRef.asset("a1"), Action.REVIEW_DECIDE)).thenReturn(
                new AccessContext(AccessRole.EDITOR, null, AccessRole.EDITOR, null, true, ProjectStatus.ACTIVE, false, List.of()));

        FileBusinessException e = assertThrows(FileBusinessException.class, () -> service.submitDecision("rs1", approve()));

        assertEquals(ErrorCode.ACTION_NOT_ALLOWED, e.getErrorCode());
        verify(reviewSessionRepo, never()).save(any());
    }
}
