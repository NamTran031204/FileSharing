package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.CommonResponse;
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
import org.example.filesharing.services.FolderService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/folder")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;

    @PostMapping("/create-new")
    public CommonResponse<FolderEntity> createNewFolder(@RequestBody FolderCreateRequestDTO request) {
        return CommonResponse.success(folderService.createNewFolder(request));
    }

    @PostMapping("/create-tree")
    public CommonResponse<FolderTreeCreateResponseDTO> createFolderTree(@RequestBody FolderTreeCreateRequestDTO request) {
        return CommonResponse.success(folderService.createFolderTree(request));
    }

    @PostMapping("/update-detail")
    public CommonResponse<FolderEntity> updateFolderDetail(@RequestBody FolderUpdateRequestDTO request) {
        return CommonResponse.success(folderService.updateFolderDetail(request));
    }

    @GetMapping("/get-by-id/{folderId}")
    public CommonResponse<FolderEntity> getFolderById(@PathVariable("folderId") String folderId) {
        return CommonResponse.success(folderService.getFolderById(folderId));
    }

    @PostMapping("/get-page")
    public CommonResponse<PageResult<FolderEntity>> getFolderPage(@RequestBody PageRequestDto<FolderFilterRequestDTO> dto) {
        return CommonResponse.success(folderService.getFolderPage(dto));
    }

    @GetMapping("/get-tree/{projectId}")
    public CommonResponse<FolderTreeResponseDTO> getFolderTree(
            @PathVariable("projectId") String projectId,
            @RequestParam(value = "currentFolderId", required = false) String currentFolderId) {
        return CommonResponse.success(folderService.getFolderTree(projectId, currentFolderId));
    }

    @PostMapping("/archive/{folderId}")
    public CommonResponse<FolderArchiveResponseDTO> archiveFolder(@PathVariable("folderId") String folderId) {
        return CommonResponse.success(folderService.archiveFolder(folderId));
    }

    @PostMapping("/restore/{folderId}")
    public CommonResponse<FolderEntity> restoreFolder(@PathVariable("folderId") String folderId) {
        return CommonResponse.success(folderService.restoreFolder(folderId));
    }

    @PostMapping("/get-trash")
    public CommonResponse<PageResult<FolderEntity>> getFolderTrash(@RequestBody PageRequestDto<FolderFilterRequestDTO> dto) {
        return CommonResponse.success(folderService.getFolderTrash(dto));
    }

    @DeleteMapping("/delete/{folderId}")
    public CommonResponse<String> deleteFolder(@PathVariable("folderId") String folderId) {
        folderService.deleteFolder(folderId);
        return CommonResponse.success("Folder permanently deleted");
    }

    @PostMapping("/change-visibility")
    public CommonResponse<FolderEntity> changeFolderVisibility(@RequestBody FolderChangeVisibilityRequestDTO request) {
        return CommonResponse.success(folderService.changeFolderVisibility(request));
    }
}
