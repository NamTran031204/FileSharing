package org.example.filesharing.services;

import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.folder.FolderCreateRequestDTO;
import org.example.filesharing.entities.dtos.folder.FolderFilterRequestDTO;
import org.example.filesharing.entities.dtos.folder.FolderUpdateRequestDTO;
import org.example.filesharing.entities.models.core.FolderEntity;

public interface FolderService {
    FolderEntity createNewFolder(FolderCreateRequestDTO request);
    FolderEntity updateFolderDetail(FolderUpdateRequestDTO request);
    FolderEntity getFolderById(String folderId);
    PageResult<FolderEntity> getFolderPage(PageRequestDto<FolderFilterRequestDTO> dto);
    void deleteFolder(String folderId);
}
