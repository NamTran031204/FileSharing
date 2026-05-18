package org.example.filesharing.services;

import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.folder.FolderArchiveResponseDTO;
import org.example.filesharing.entities.dtos.folder.FolderChangeVisibilityRequestDTO;
import org.example.filesharing.entities.dtos.folder.FolderCreateRequestDTO;
import org.example.filesharing.entities.dtos.folder.FolderFilterRequestDTO;
import org.example.filesharing.entities.dtos.folder.FolderTreeCreateRequestDTO;
import org.example.filesharing.entities.dtos.folder.FolderTreeCreateResponseDTO;
import org.example.filesharing.entities.dtos.folder.FolderTreeResponseDTO;
import org.example.filesharing.entities.dtos.folder.FolderUpdateRequestDTO;
import org.example.filesharing.entities.models.FolderEntity;

public interface FolderService {
    FolderEntity createNewFolder(FolderCreateRequestDTO request);
    FolderTreeCreateResponseDTO createFolderTree(FolderTreeCreateRequestDTO request);
    FolderEntity updateFolderDetail(FolderUpdateRequestDTO request);
    FolderEntity getFolderById(String folderId);
    PageResult<FolderEntity> getFolderPage(PageRequestDto<FolderFilterRequestDTO> dto);
    FolderTreeResponseDTO getFolderTree(String projectId, String currentFolderId);
    FolderArchiveResponseDTO archiveFolder(String folderId);
    FolderEntity restoreFolder(String folderId);
    PageResult<FolderEntity> getFolderTrash(PageRequestDto<FolderFilterRequestDTO> dto);
    void deleteFolder(String folderId);
    FolderEntity changeFolderVisibility(FolderChangeVisibilityRequestDTO request);
}
