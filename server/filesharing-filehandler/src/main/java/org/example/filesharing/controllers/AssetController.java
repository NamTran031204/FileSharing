package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import com.file.service.filesharing.core.entity.CommonResponse;
import com.file.service.filesharing.core.entity.PageRequestDto;
import com.file.service.filesharing.core.entity.PageResult;
import org.example.filesharing.entities.dtos.asset.*;
import com.file.service.filesharing.core.entity.models.AssetEntity;
import com.file.service.filesharing.core.entity.models.MetadataEntity;
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

	@PostMapping("/move-to-trash/{assetId}")
	public CommonResponse<String> moveToTrash(@PathVariable("assetId") String assetId) {
		assetService.moveToTrash(assetId);
		return CommonResponse.success("Asset moved to trash");
	}

	@PostMapping("/restore-from-trash/{assetId}")
	public CommonResponse<String> restoreFromTrash(@PathVariable("assetId") String assetId) {
		assetService.restoreFromTrash(assetId);
		return CommonResponse.success("Asset restored from trash");
	}

	@PostMapping("/undo-delete/{assetId}")
	public CommonResponse<String> undoDelete(@PathVariable("assetId") String assetId) {
		assetService.undoDelete(assetId);
		return CommonResponse.success("Asset restored successfully");
	}

}
