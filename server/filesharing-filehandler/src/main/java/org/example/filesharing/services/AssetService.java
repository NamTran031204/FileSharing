package org.example.filesharing.services;

import com.file.service.filesharing.core.entity.PageRequestDto;
import com.file.service.filesharing.core.entity.PageResult;
import org.example.filesharing.entities.dtos.asset.*;
import com.file.service.filesharing.core.entity.models.AssetEntity;
import com.file.service.filesharing.core.entity.models.MetadataEntity;

public interface AssetService {
    AssetCreateResponseDto createAsset(AssetCreateRequestDto request);

    AssetDetailResponseDto getAssetById(String assetId);

    PageResult<AssetSummaryDto> getAssetPage(PageRequestDto<AssetFilterRequestDto> dto);

    AssetEntity updateAsset(AssetUpdateRequestDto request);

    AssetEntity moveAsset(AssetMoveRequestDto request);

    void deleteAsset(String assetId);

    void moveToTrash(String assetId);

    void restoreFromTrash(String assetId);

    void undoDelete(String assetId);

    AssetCreateResponseDto createVersion(AssetCreateRequestDto request);

    MetadataEntity updateVersion(VersionUpdateRequestDto request);

    PageResult<MetadataEntity> getVersionPage(PageRequestDto<VersionFilterRequestDto> dto);

    MetadataEntity getVersion(String assetId, Integer versionNumber);

    MetadataEntity getLatestVersion(String assetId);

    void deleteVersion(String assetId, Integer versionNumber);
}
