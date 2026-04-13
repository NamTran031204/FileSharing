package org.example.filesharing.services;

import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.file.EmailSenderRequestDto;
import org.example.filesharing.entities.dtos.file.UserFileFilterPageRequestDto;
import org.example.filesharing.entities.dtos.metadata.MetadataDTO;
import org.example.filesharing.entities.dtos.metadata.MetadataUpdateRequestDto;
import org.example.filesharing.entities.models.core.MetadataEntity;

import java.util.List;

public interface MetadataService {
    MetadataEntity saveMetadata(MetadataDTO metadata, String uploadId);

    void completeUpload(String objectName, String uploadId);

    void uploadFailed(String objectName, String uploadId);

    List<Integer> resumeUpload(String uploadId);

    Boolean addUserViaEmail(EmailSenderRequestDto input);

    MetadataEntity updateMetadata(MetadataUpdateRequestDto input, String fileId);

    PageResult<MetadataEntity> getFilesByFilter(PageRequestDto<UserFileFilterPageRequestDto> input);

    void deleteMetadata(String fileId);

    void moveMetadataToTrash(String fileId);

    void restoreFileFromTrash(String fileId);

    MetadataEntity getFileByToken(String token);

    MetadataEntity checkUserOnFile(String shareToken);
}
