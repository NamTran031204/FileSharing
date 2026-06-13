package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import com.file.service.filesharing.core.entity.CommonResponse;
import com.file.service.filesharing.core.entity.PageRequestDto;
import com.file.service.filesharing.core.entity.PageResult;
import org.example.filesharing.entities.dtos.asset.AssetCreateRequestDto;
import org.example.filesharing.entities.dtos.asset.AssetCreateResponseDto;
import org.example.filesharing.entities.dtos.asset.VersionFilterRequestDto;
import org.example.filesharing.entities.dtos.asset.VersionUpdateRequestDto;
import com.file.service.filesharing.core.entity.models.MetadataEntity;
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

    @GetMapping("/{assetId}/{versionNumber}")
    public CommonResponse<MetadataEntity> getVersion(@PathVariable("assetId") String assetId,
                                                     @PathVariable("versionNumber") Integer versionNumber) {
        return CommonResponse.success(assetService.getVersion(assetId, versionNumber));
    }

    @PostMapping("/{assetId}/{versionNumber}/delete")
    public CommonResponse<String> deleteVersion(@PathVariable("assetId") String assetId,
                                                @PathVariable("versionNumber") Integer versionNumber) {
        assetService.deleteVersion(assetId, versionNumber);
        return CommonResponse.success("Version deleted successfully");
    }
}
