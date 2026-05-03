package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.asset.*;
import org.example.filesharing.entities.models.core.AssetEntity;
import org.example.filesharing.entities.models.core.MetadataEntity;
import org.example.filesharing.services.AssetService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/asset")
@RequiredArgsConstructor
public class AssetController {
	private final AssetService assetService;

	@PostMapping("/create-new")
	public CommonResponse<AssetCreateResponseDto> createAsset(@RequestBody AssetCreateRequestDto request) {
		return CommonResponse.success(assetService.createAsset(request));
	}

	@PostMapping("/update-detail")
	public CommonResponse<AssetEntity> updateAsset(@RequestBody AssetUpdateRequestDto request) {
		return CommonResponse.success(assetService.updateAsset(request));
	}

	@PostMapping("/move")
	public CommonResponse<AssetEntity> moveAsset(@RequestBody AssetMoveRequestDto request) {
		return CommonResponse.success(assetService.moveAsset(request));
	}

	@GetMapping("/get-by-id/{assetId}")
	public CommonResponse<AssetDetailResponseDto> getAssetById(@PathVariable("assetId") String assetId) {
		return CommonResponse.success(assetService.getAssetById(assetId));
	}

	@PostMapping("/get-page")
	public CommonResponse<PageResult<AssetSummaryDto>> getAssetPage(@RequestBody PageRequestDto<AssetFilterRequestDto> dto) {
		return CommonResponse.success(assetService.getAssetPage(dto));
	}

	@GetMapping("/get-latest-version/{assetId}")
	public CommonResponse<MetadataEntity> getLatestVersion(@PathVariable("assetId") String assetId) {
		return CommonResponse.success(assetService.getLatestVersion(assetId));
	}

	@PostMapping("/delete/{assetId}")
	public CommonResponse<String> deleteAsset(@PathVariable("assetId") String assetId) {
		assetService.deleteAsset(assetId);
		return CommonResponse.success("Asset deleted successfully");
	}

	@PostMapping("/version/create-new")
	public CommonResponse<VersionCreateResponseDto> createVersion(@RequestBody VersionCreateRequestDto request) {
		return CommonResponse.success(assetService.createVersion(request));
	}

	@PostMapping("/version/update-detail")
	public CommonResponse<MetadataEntity> updateVersion(@RequestBody VersionUpdateRequestDto request) {
		return CommonResponse.success(assetService.updateVersion(request));
	}

	@PostMapping("/version/get-page")
	public CommonResponse<PageResult<MetadataEntity>> getVersionPage(@RequestBody PageRequestDto<VersionFilterRequestDto> dto) {
		return CommonResponse.success(assetService.getVersionPage(dto));
	}

	@GetMapping("/version/get-by-id/{versionId}")
	public CommonResponse<MetadataEntity> getVersionById(@PathVariable("versionId") String versionId) {
		return CommonResponse.success(assetService.getVersionById(versionId));
	}

	@PostMapping("/version/delete/{versionId}")
	public CommonResponse<String> deleteVersion(@PathVariable("versionId") String versionId) {
		assetService.deleteVersion(versionId);
		return CommonResponse.success("Version deleted successfully");
	}
}
