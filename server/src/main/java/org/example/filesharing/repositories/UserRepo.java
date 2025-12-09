package org.example.filesharing.repositories;

import org.example.filesharing.entities.models.UserEntity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepo extends MongoRepository<UserEntity, String> {
    Optional<UserEntity> findByEmail(String email);
}
