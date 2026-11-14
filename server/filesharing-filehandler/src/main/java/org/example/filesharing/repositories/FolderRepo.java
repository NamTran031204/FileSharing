package org.example.filesharing.repositories;

import com.file.service.filesharing.core.entity.models.FolderEntity;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface FolderRepo extends MongoRepository<FolderEntity, String> {
    List<FolderEntity> findByProjectId(String projectId);
    Optional<FolderEntity> findByLinkToken(String token);
    List<FolderEntity> findByParentFolderId(String parentFolderId);
    Optional<FolderEntity> findByProjectIdAndParentFolderIdAndFolderName(String projectId, String parentFolderId, String folderName);
    List<FolderEntity> findByAncestorIdsContaining(String ancestorId);
    List<FolderEntity> findByProjectIdAndAncestorIdsContaining(String projectId, String ancestorId);
}
