package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.AssetEntity;
import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.models.NotificationEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.entity.models.ProofSelectionEntity;
import com.file.service.filesharing.core.entity.models.access.LinkAccess;
import com.file.service.filesharing.core.enums.MediaType;
import com.file.service.filesharing.core.enums.ProjectStatus;
import com.file.service.filesharing.core.enums.ProofSelectionStatus;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import org.example.filesharing.entities.dtos.proof.ProofLandingResponseDto;
import org.example.filesharing.entities.dtos.proof.ProofSubmitRequestDto;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.repositories.FolderRepo;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.repositories.NotificationRepo;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.repositories.ProofSelectionRepo;
import org.example.filesharing.repositories.UserRepo;
import org.example.filesharing.services.MinIoService;
import org.example.filesharing.utils.ProofTokenUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.MessageSource;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.UpdateDefinition;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/** Luong proof khach chay tren folder.link (T16): tim theo link.token, het han tra LINK_EXPIRED. */
class ProofPublicServiceImplTest {

    private static final String TOKEN = "tok-proof";
    private static final String PX = "px";
    private static final String F2 = "f2";
    private static final String LINK_CREATOR = "u-creator";

    private FolderRepo folderRepo;
    private ProjectRepo projectRepo;
    private AssetRepo assetRepo;
    private ProofSelectionRepo proofSelectionRepo;
    private NotificationRepo notificationRepo;
    private UserRepo userRepo;
    private MongoTemplate mongoTemplate;
    private MessageSource messageSource;
    private ProofPublicServiceImpl service;

    private FolderEntity folder;
    private ProjectEntity project;

    @BeforeEach
    void setUp() {
        folderRepo = mock(FolderRepo.class);
        projectRepo = mock(ProjectRepo.class);
        assetRepo = mock(AssetRepo.class);
        proofSelectionRepo = mock(ProofSelectionRepo.class);
        notificationRepo = mock(NotificationRepo.class);
        userRepo = mock(UserRepo.class);
        mongoTemplate = mock(MongoTemplate.class);
        messageSource = mock(MessageSource.class);
        service = new ProofPublicServiceImpl(messageSource, folderRepo, projectRepo, assetRepo,
                mock(MetadataRepo.class), proofSelectionRepo, notificationRepo, userRepo, mongoTemplate,
                mock(MinIoService.class),
                new com.file.service.filesharing.core.setting.RuntimeSettings(mongoTemplate, null, new org.springframework.mock.env.MockEnvironment(), java.time.Duration.ofSeconds(10)));

        // proof chi xet link cua folder
        folder = FolderEntity.builder().folderId(F2).projectId(PX).folderName("RAW noi bo")
                .link(LinkAccess.builder().token(TOKEN).role(null).allowProofSelection(true).allowDownload(false)
                        .createdBy(LINK_CREATOR).build())
                .build();
        folder.setIsActive(true);
        folder.setIsTrash(false);
        project = ProjectEntity.builder().projectId(PX).status(ProjectStatus.ACTIVE).build();
        project.setIsActive(true);

        when(folderRepo.findByLinkToken(TOKEN)).thenAnswer(inv -> Optional.of(folder));
        when(projectRepo.findById(PX)).thenAnswer(inv -> Optional.of(project));
        when(mongoTemplate.count(any(Query.class), eq(AssetEntity.class))).thenReturn(3L);
    }

    @Test
    void expiredLinkIsLinkExpiredGone() {
        folder.getLink().setExpiresAt(Instant.now().minus(1, ChronoUnit.HOURS));

        FileBusinessException e = assertThrows(FileBusinessException.class, () -> service.getLanding(TOKEN));

        assertEquals(ErrorCode.LINK_EXPIRED, e.getErrorCode());
        assertEquals(HttpStatus.GONE, ErrorCode.LINK_EXPIRED.getHttpStatus());
    }

    @Test
    void landingFindsFolderByLinkTokenAndReturnsLinkExpiry() {
        Instant expiresAt = Instant.now().plus(1, ChronoUnit.DAYS);
        folder.getLink().setExpiresAt(expiresAt);

        ProofLandingResponseDto landing = service.getLanding(TOKEN);

        assertEquals("RAW noi bo", landing.getFolderName());
        assertEquals(3L, landing.getImageCount());
        assertEquals(expiresAt, landing.getShareExpiry());
    }

    @Test
    void oldShareTokenWithoutLinkIsInvalid() {
        when(folderRepo.findByLinkToken("old")).thenReturn(Optional.empty());

        FileBusinessException e = assertThrows(FileBusinessException.class, () -> service.getLanding("old"));

        assertEquals(ErrorCode.PROOF_LINK_INVALID, e.getErrorCode());
    }

    @Test
    void linkWithoutProofSelectionIsInvalid() {
        folder.getLink().setAllowProofSelection(false);

        FileBusinessException e = assertThrows(FileBusinessException.class, () -> service.getLanding(TOKEN));

        assertEquals(ErrorCode.PROOF_LINK_INVALID, e.getErrorCode());
    }

    @Test
    void trashedFolderOrArchivedProjectIsInvalid() {
        folder.setIsTrash(true);
        assertEquals(ErrorCode.PROOF_LINK_INVALID,
                assertThrows(FileBusinessException.class, () -> service.getLanding(TOKEN)).getErrorCode());

        folder.setIsTrash(false);
        project.setStatus(ProjectStatus.ARCHIVED);
        assertEquals(ErrorCode.PROOF_LINK_INVALID,
                assertThrows(FileBusinessException.class, () -> service.getLanding(TOKEN)).getErrorCode());
    }

    @Test
    void submitNotifiesLinkCreator() {
        String guestKey = "guest-key";
        ProofSelectionEntity session = ProofSelectionEntity.builder().selectionId("s1").folderId(F2)
                .guestName("Khach").status(ProofSelectionStatus.DRAFT).build();
        when(proofSelectionRepo.findByGuestKeyHash(ProofTokenUtils.sha256Hex(guestKey))).thenReturn(Optional.of(session));
        AssetEntity asset = AssetEntity.builder().assetId("a2").folderId(F2).mediaType(MediaType.IMAGE).build();
        asset.setIsActive(true);
        asset.setIsTrash(false);
        when(assetRepo.findAllById(List.of("a2"))).thenReturn(List.of(asset));
        ProofSelectionEntity submitted = ProofSelectionEntity.builder().selectionId("s1").folderId(F2)
                .guestName("Khach").assetIds(List.of("a2")).status(ProofSelectionStatus.SUBMITTED).build();
        when(mongoTemplate.findAndModify(any(Query.class), any(UpdateDefinition.class),
                any(FindAndModifyOptions.class), eq(ProofSelectionEntity.class))).thenReturn(submitted);
        when(userRepo.findById(LINK_CREATOR)).thenReturn(Optional.of(UserEntity.builder().userId(LINK_CREATOR).build()));
        when(messageSource.getMessage(anyString(), any(), any())).thenReturn("x");
        ProofSubmitRequestDto request = new ProofSubmitRequestDto();
        request.setAssetIds(List.of("a2"));

        service.submit(TOKEN, guestKey, request);

        ArgumentCaptor<NotificationEntity> captor = ArgumentCaptor.forClass(NotificationEntity.class);
        verify(notificationRepo).save(captor.capture());
        assertEquals(LINK_CREATOR, captor.getValue().getUserId());
    }
}
