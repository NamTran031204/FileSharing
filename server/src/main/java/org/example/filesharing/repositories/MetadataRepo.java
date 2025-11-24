package org.example.filesharing.repositories;

import org.example.filesharing.entities.models.Metadata;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface MetadataRepo extends MongoRepository<Metadata, String> {
    Optional<Metadata> findByFileNameAndUploadId(String fileName, String uploadId);
}
