package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.MetadataEntity;
import com.file.service.filesharing.core.enums.UploadStatus;
import com.file.service.filesharing.core.enums.auth.UserGrantedRole;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import org.example.filesharing.entities.dtos.metadata.DownloadFileRequestDto;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.jobs.kafka.EmailProducer;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.services.AccessService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.JobSubmitService;
import org.example.filesharing.services.MinIoService;
import org.example.filesharing.services.StorageService;
import org.example.filesharing.utils.access.Action;
import org.example.filesharing.utils.access.ResourceRef;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/** Q5: tai ban goc chi theo AccessService (DOWNLOAD); file Phase1 khong gan project chi admin tai duoc. */
class MetadataServiceImplTest {

    private static final String OBJECT = "obj-1";
    private static final String UPLOADER = "u-uploader";

    private MetadataRepo metadataRepo;
    private AuditService auditService;
    private StorageService storageService;
    private AccessService accessService;
    private MetadataServiceImpl service;

    @BeforeEach
    void setUp() {
        metadataRepo = mock(MetadataRepo.class);
        auditService = mock(AuditService.class);
        storageService = mock(StorageService.class);
        accessService = mock(AccessService.class);
        service = new MetadataServiceImpl(metadataRepo, mock(MongoTemplate.class), auditService,
                mock(MinIoService.class), storageService, mock(PasswordEncoder.class), mock(EmailProducer.class),
                mock(JobSubmitService.class), accessService);
        when(storageService.presignGetObject(anyString(), anyString(), anyLong())).thenReturn("signed");
    }

    private void file(String assetId, String projectId) {
        MetadataEntity m = MetadataEntity.builder().objectName(OBJECT).fileName("a.png").fileSize(10L)
                .status(UploadStatus.COMPLETED).ownerId(UPLOADER).assetId(assetId).projectId(projectId).build();
        when(metadataRepo.findByObjectName(OBJECT)).thenReturn(Optional.of(m));
    }

    private void currentUser(String userId, UserGrantedRole... roles) {
        UserEntity user = new UserEntity();
        user.setUserId(userId);
        user.setUserGrantedRoles(List.of(roles));
        when(auditService.getCurrentUser()).thenReturn(user);
        when(auditService.getCurrentUserId()).thenReturn(userId);
    }

    private static DownloadFileRequestDto request() {
        DownloadFileRequestDto dto = new DownloadFileRequestDto();
        dto.setObjectName(OBJECT);
        return dto;
    }

    private ErrorCode codeOf(Runnable call) {
        return assertThrows(FileBusinessException.class, call::run).getErrorCode();
    }

    @Test
    void assetFileRequiresDownloadOnAsset() {
        file("a1", "p1");
        currentUser("u-viewer", UserGrantedRole.ROLE_USER);

        assertEquals("signed", service.getDownloadUrl(request()).getUrl());
        verify(accessService).require(ResourceRef.asset("a1"), Action.DOWNLOAD);
    }

    @Test
    void assetFileDeniedForUploaderAndAdminWithoutRole() {
        file("a1", "p1");
        currentUser(UPLOADER, UserGrantedRole.ROLE_SA);
        when(accessService.require(ResourceRef.asset("a1"), Action.DOWNLOAD))
                .thenThrow(new FileBusinessException(ErrorCode.ACCESS_DENIED));

        assertEquals(ErrorCode.ACCESS_DENIED, codeOf(() -> service.getDownloadUrl(request())));
        verify(storageService, never()).presignGetObject(anyString(), anyString(), anyLong());
    }

    @Test
    void projectOnlyFileRequiresDownloadOnProject() {
        file(null, "p1");
        currentUser("u-viewer", UserGrantedRole.ROLE_USER);

        service.getDownloadUrl(request());
        verify(accessService).require(ResourceRef.project("p1"), Action.DOWNLOAD);
    }

    @Test
    void phase1FileUploaderGetsFilePermissionError() {
        file(null, null);
        currentUser(UPLOADER, UserGrantedRole.ROLE_USER);

        assertEquals(ErrorCode.FILE_PERMISSION_ERROR, codeOf(() -> service.getDownloadUrl(request())));
        verify(accessService, never()).require(any(), any());
        verify(storageService, never()).presignGetObject(anyString(), anyString(), anyLong());
    }

    @Test
    void phase1FileSaIsDeniedToo() {
        file(null, null);
        currentUser("u-sa", UserGrantedRole.ROLE_SA);

        assertEquals(ErrorCode.FILE_PERMISSION_ERROR, codeOf(() -> service.getDownloadUrl(request())));
        verify(accessService, never()).require(any(), any());
        verify(storageService, never()).presignGetObject(anyString(), anyString(), anyLong());
    }
}
