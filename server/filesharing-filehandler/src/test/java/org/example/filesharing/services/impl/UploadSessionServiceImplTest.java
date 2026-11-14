package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.UploadSessionEntity;
import com.file.service.filesharing.core.enums.UploadSessionStatus;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import org.example.filesharing.entities.dtos.upload.CompletedPartDto;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.repositories.UploadSessionRepo;
import org.example.filesharing.services.AccessService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.JobSubmitService;
import org.example.filesharing.services.MetadataService;
import org.example.filesharing.services.MinIoService;
import org.example.filesharing.services.StorageService;
import org.example.filesharing.utils.access.Action;
import org.example.filesharing.utils.access.ResourceRef;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** complete kiem lai UPLOAD tren asset truoc khi commit (AC-14, T13). */
class UploadSessionServiceImplTest {

    @Test
    void completeAfterLosingUploadIsRejectedBeforeCommit() {
        UploadSessionRepo uploadSessionRepo = mock(UploadSessionRepo.class);
        StorageService storageService = mock(StorageService.class);
        MetadataService metadataService = mock(MetadataService.class);
        AccessService accessService = mock(AccessService.class);
        AuditService auditService = mock(AuditService.class);
        UploadSessionServiceImpl service = new UploadSessionServiceImpl(uploadSessionRepo, mock(MetadataRepo.class),
                mock(JobSubmitService.class), mock(MongoTemplate.class), auditService, storageService, metadataService,
                mock(MinIoService.class), accessService);

        UploadSessionEntity session = UploadSessionEntity.builder().sessionId("s1").ownerId("u2").assetId("a1")
                .status(UploadSessionStatus.INITIATED).expiresAt(Instant.now().plusSeconds(600)).build();
        when(uploadSessionRepo.findById("s1")).thenReturn(Optional.of(session));
        when(auditService.getCurrentUserId()).thenReturn("u2");
        when(accessService.require(ResourceRef.asset("a1"), Action.UPLOAD))
                .thenThrow(new FileBusinessException(ErrorCode.ACTION_NOT_ALLOWED));

        CompletedPartDto part = new CompletedPartDto();
        part.setPartNumber(1);
        FileBusinessException e = assertThrows(FileBusinessException.class, () -> service.complete("s1", List.of(part)));

        assertEquals(ErrorCode.ACTION_NOT_ALLOWED, e.getErrorCode());
        verifyNoInteractions(storageService, metadataService);
        verify(uploadSessionRepo, never()).save(any());
    }
}
