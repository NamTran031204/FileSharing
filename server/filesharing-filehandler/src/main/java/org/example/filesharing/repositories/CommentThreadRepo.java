package org.example.filesharing.repositories;

import org.example.filesharing.entities.models.CommentThreadEntity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CommentThreadRepo extends MongoRepository<CommentThreadEntity, String> {
    Optional<CommentThreadEntity> findByThreadIdAndIsActiveTrue(String threadId);
}
