package org.example.filesharing.repositories;

import org.example.filesharing.entities.models.AssetEntity;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface AssetRepo extends MongoRepository<AssetEntity, String> {
	long countByFolderIdAndIsActiveTrue(String folderId);

	List<AssetEntity> findByFolderIdInAndIsActiveTrue(List<String> folderIds);

	Optional<AssetEntity> findByAssetNameAndFolderIdAndProjectIdAndIsActiveTrue(String assetName, String folderId, String projectId);

}
