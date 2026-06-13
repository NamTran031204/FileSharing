package org.example.filesharing.repositories;

import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.enums.FolderVisibility;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface FolderRepo extends MongoRepository<FolderEntity, String> {
    List<FolderEntity> findByProjectId(String projectId);
    List<FolderEntity> findByParentFolderId(String parentFolderId);
    Optional<FolderEntity> findByProjectIdAndParentFolderIdAndFolderName(String projectId, String parentFolderId, String folderName);
    List<FolderEntity> findByAncestorIdsContaining(String ancestorId);
    List<FolderEntity> findByProjectIdAndAncestorIdsContaining(String projectId, String ancestorId);

    @Query("{ 'projectId': ?0, 'visibility': { $in: ?1 }, 'isActive': true, 'isTrash': { $ne: true } }")
    List<FolderEntity> findByProjectIdAndVisibilityIn(String projectId, List<FolderVisibility> visibilities);

    @Query("{ 'ancestorIds': ?0, 'visibility': 'INHERIT', 'isActive': true, 'isTrash': { $ne: true } }")
    List<FolderEntity> findInheritDescendants(String ancestorFolderId);

    @Query("{ 'projectId': ?0, 'userPermissions.userId': ?1, 'isActive': true, 'isTrash': { $ne: true } }")
    List<FolderEntity> findByProjectIdAndUserPermissionsUserId(String projectId, String userId);
}
