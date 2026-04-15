package org.example.filesharing.repositories;

import org.example.filesharing.entities.models.core.AssetEntity;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AssetRepo extends MongoRepository<AssetEntity, String> {
}
