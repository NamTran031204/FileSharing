package org.example.filesharing.repositories;

import com.file.service.filesharing.core.entity.models.ProjectEntity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRepo extends MongoRepository<ProjectEntity, String> {
    boolean existsByProjectCode(String projectCode);

    boolean existsByProjectCodeAndProjectIdNot(String projectCode, String projectId);

    boolean existsByProjectName(String projectName);

    boolean existsByProjectNameAndIsActiveAndOwnerId(String projectName, boolean isActive, String ownerId);

    boolean existsByProjectCodeAndIsActiveAndOwnerId(String projectCode, boolean isActive, String ownerId);

    boolean existsByProjectNameAndIsActive(String projectName, boolean isActive);

    boolean existsByProjectCodeAndIsActive(String projectCode, Boolean isActive);

    void deleteByProjectId(String projectId);
}
