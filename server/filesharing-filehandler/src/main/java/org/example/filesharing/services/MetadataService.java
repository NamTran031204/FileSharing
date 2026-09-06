package org.example.filesharing.services;

import com.file.service.filesharing.core.entity.PageRequestDto;
import com.file.service.filesharing.core.entity.PageResult;
import org.example.filesharing.entities.dtos.file.EmailSenderRequestDto;
import org.example.filesharing.entities.dtos.file.UserFileFilterPageRequestDto;
import org.example.filesharing.entities.dtos.metadata.DownloadFileRequestDto;
import org.example.filesharing.entities.dtos.metadata.DownloadFileResponseDto;
import org.example.filesharing.entities.dtos.metadata.MetadataDTO;
import org.example.filesharing.entities.dtos.metadata.MetadataUpdateRequestDto;
import com.file.service.filesharing.core.entity.models.MetadataEntity;

import java.util.List;

public interface MetadataService {
    MetadataEntity saveMetadata(MetadataDTO metadata, String uploadId);

    void completeUpload(String objectName, String uploadId);

    void uploadFailed(String objectName, String uploadId);

    List<Integer> resumeUpload(String uploadId);

    /**
     * E4 — mark the metadata version COMPLETED with the real size read back from storage.
     * Does not publish any Kafka message (call {@link #publishProcessingJob(MetadataEntity)} after
     * the upload session has been committed, per REL-02 "Kafka last").
     */
    MetadataEntity markUploadCompleted(String metadataId, long actualFileSize);

    /**
     * Dispatches the post-upload processing job (video encode / image transcode) for a completed version.
     */
    void publishProcessingJob(MetadataEntity entity);

    /**
     * E5 — mark the metadata version FAILED (session aborted).
     */
    void markUploadFailed(String metadataId);

    /**
     * E6 — resolve download url for an object, after ownership/permission + readiness checks.
     */
    DownloadFileResponseDto getDownloadUrl(DownloadFileRequestDto request);

    Boolean addUserViaEmail(EmailSenderRequestDto input);

    MetadataEntity updateMetadata(MetadataUpdateRequestDto input, String fileId);

    PageResult<MetadataEntity> getFilesByFilter(PageRequestDto<UserFileFilterPageRequestDto> input);

    void deleteMetadata(String fileId);

    void moveMetadataToTrash(String fileId);

    void restoreFileFromTrash(String fileId);

    MetadataEntity getFileByToken(String token);

    MetadataEntity checkUserOnFile(String shareToken);
}
