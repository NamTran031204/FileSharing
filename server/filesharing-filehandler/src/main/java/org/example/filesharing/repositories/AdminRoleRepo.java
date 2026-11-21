package org.example.filesharing.repositories;

import org.example.filesharing.entities.models.AdminRoleEntity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminRoleRepo extends MongoRepository<AdminRoleEntity, String> {
    boolean existsByCode(String code);

    Optional<AdminRoleEntity> findByCode(String code);
}
