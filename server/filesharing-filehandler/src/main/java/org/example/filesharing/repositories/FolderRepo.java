package org.example.filesharing.repositories;

import org.example.filesharing.entities.models.FolderEntity;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface FolderRepo extends MongoRepository<FolderEntity, String> {
    List<FolderEntity> findByProjectId(String projectId);
    List<FolderEntity> findByParentFolderId(String parentFolderId);
    Optional<FolderEntity> findByProjectIdAndParentFolderIdAndFolderName(String projectId, String parentFolderId, String folderName);
    Optional<FolderEntity> findByProjectIdAndFolderPath(String projectId, String folderPath);
    List<FolderEntity> findByFolderPathStartingWith(String folderPath);
}
