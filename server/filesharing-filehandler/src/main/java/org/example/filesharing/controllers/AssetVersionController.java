package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.asset.AssetCreateRequestDto;
import org.example.filesharing.entities.dtos.asset.AssetCreateResponseDto;
import org.example.filesharing.entities.dtos.asset.VersionFilterRequestDto;
import org.example.filesharing.entities.dtos.asset.VersionUpdateRequestDto;
import org.example.filesharing.entities.models.core.MetadataEntity;
import org.example.filesharing.services.AssetService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/asset/version")
@RequiredArgsConstructor
public class AssetVersionController {

    private final AssetService assetService;

    @PostMapping("/create-new")
    public CommonResponse<AssetCreateResponseDto> createVersion(@RequestBody AssetCreateRequestDto request) {
        return CommonResponse.success(assetService.createVersion(request));
    }

    @PostMapping("/update-detail")
    public CommonResponse<MetadataEntity> updateVersion(@RequestBody VersionUpdateRequestDto request) {
        return CommonResponse.success(assetService.updateVersion(request));
    }

    @PostMapping("/get-page")
    public CommonResponse<PageResult<MetadataEntity>> getVersionPage(@RequestBody PageRequestDto<VersionFilterRequestDto> dto) {
        return CommonResponse.success(assetService.getVersionPage(dto));
    }

    @GetMapping("/get-by-id/{versionId}")
    public CommonResponse<MetadataEntity> getVersionById(@PathVariable("versionId") String versionId) {
        return CommonResponse.success(assetService.getVersionById(versionId));
    }

    @PostMapping("/delete/{versionId}")
    public CommonResponse<String> deleteVersion(@PathVariable("versionId") String versionId) {
        assetService.deleteVersion(versionId);
        return CommonResponse.success("Version deleted successfully");
    }
}
