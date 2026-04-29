package org.example.filesharing.repositories;

import org.example.filesharing.entities.models.core.AssetEntity;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AssetRepo extends MongoRepository<AssetEntity, String> {
	long countByFolderIdAndIsActiveTrue(String folderId);

	List<AssetEntity> findByFolderIdInAndIsActiveTrue(List<String> folderIds);
}
