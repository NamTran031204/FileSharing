package org.example.filesharing.repositories;

import org.example.filesharing.entities.models.ProjectEntity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectRepo extends MongoRepository<ProjectEntity, String> {
    boolean existsByProjectCode(String projectCode);

    boolean existsByProjectCodeAndProjectIdNot(String projectCode, String projectId);

    boolean existsByProjectName(String projectName);

    boolean existsByProjectNameAndIsActiveAndOwnerId(String projectName, boolean isActive, String ownerId);

    boolean existsByProjectCodeAndIsActiveAndOwnerId(String projectCode, boolean isActive, String ownerId);

    boolean existsByProjectNameAndIsActive(String projectName, boolean isActive);

    boolean existsByProjectCodeAndIsActive(String projectCode, Boolean isActive);

    Optional<ProjectEntity> findByShareToken(String shareToken);

    boolean existsByShareToken(String shareToken);
}
