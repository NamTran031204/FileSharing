package org.example.filesharing.services;

import com.file.service.filesharing.core.entity.models.UploadSessionEntity;

public interface UploadSessionService {

    UploadSessionEntity create(String ownerId, String assetId, String metadataId, String objectName,
                                long declaredSize, String uploadId);

    UploadSessionEntity get(String sessionId, String currentUserId);

    UploadSessionEntity touch(UploadSessionEntity session);

    UploadSessionEntity markCompleted(UploadSessionEntity session, String resultEtag);

    UploadSessionEntity markAborted(UploadSessionEntity session);
}
