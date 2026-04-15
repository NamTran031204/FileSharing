package org.example.filesharing.repositories;

import org.example.filesharing.entities.models.core.ProjectEntity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRepo extends MongoRepository<ProjectEntity, String> {
    boolean existsByProjectCode(String projectCode);

    boolean existsByProjectCodeAndProjectIdNot(String projectCode, String projectId);

    boolean existsByProjectName(String projectName);

    boolean existsByProjectNameAndIsActive(String projectName, boolean isActive);

    boolean existsByProjectCodeAndIsActive(String projectCode, Boolean isActive);
}
