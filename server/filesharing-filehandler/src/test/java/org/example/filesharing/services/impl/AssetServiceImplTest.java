package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.AssetEntity;
import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.UserBusinessException;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.repositories.FolderRepo;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.services.AccessService;
import org.example.filesharing.services.AssetAccessService;
import org.example.filesharing.services.AuditLogService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.StorageService;
import org.example.filesharing.services.UploadSessionService;
import org.example.filesharing.utils.access.Action;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Khong khoi phuc asset khi folder chua no con trong thung rac (AC-13). */
class AssetServiceImplTest {

    @Test
    void restoreAssetWhileFolderInTrashIsBadRequestAndWritesNothing() {
        AssetRepo assetRepo = mock(AssetRepo.class);
        FolderRepo folderRepo = mock(FolderRepo.class);
        AssetAccessService assetAccessService = mock(AssetAccessService.class);
        AssetServiceImpl service = new AssetServiceImpl(assetRepo, mock(MetadataRepo.class), mock(ProjectRepo.class),
                folderRepo, mock(MongoTemplate.class), mock(AuditService.class), mock(AuditLogService.class),
                mock(UploadSessionService.class), mock(StorageService.class), mock(PasswordEncoder.class),
                assetAccessService, mock(AccessService.class));

        AssetEntity asset = AssetEntity.builder().assetId("a1").projectId("px").folderId("f1").build();
        asset.setIsActive(true);
        asset.setIsTrash(true);
        when(assetRepo.findById("a1")).thenReturn(Optional.of(asset));
        FolderEntity folder = FolderEntity.builder().folderId("f1").projectId("px").build();
        folder.setIsActive(true);
        folder.setIsTrash(true);
        when(folderRepo.findById("f1")).thenReturn(Optional.of(folder));

        UserBusinessException e = assertThrows(UserBusinessException.class, () -> service.restoreFromTrash("a1"));

        assertEquals(ErrorCode.BAD_REQUEST, e.getErrorCode());
        verify(assetAccessService).ensureAssetPermission(asset, Action.TRASH);
        verify(assetRepo, never()).save(any());
    }
}
