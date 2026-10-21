package org.example.filesharing.repositories;

import com.file.service.filesharing.core.entity.models.ProofSelectionEntity;
import com.file.service.filesharing.core.enums.ProofSelectionStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProofSelectionRepo extends MongoRepository<ProofSelectionEntity, String> {
    Optional<ProofSelectionEntity> findByGuestKeyHash(String guestKeyHash);

    List<ProofSelectionEntity> findByFolderIdAndStatusOrderBySubmittedAtDesc(String folderId, ProofSelectionStatus status);
}
