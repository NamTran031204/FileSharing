package org.example.filesharing.services;

import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.file.UserFileFilterPageRequestDto;
import org.example.filesharing.entities.dtos.metadata.MetadataDTO;
import org.example.filesharing.entities.models.MetadataEntity;

import java.util.List;

public interface MetadataService {
    void saveMetadata(MetadataDTO metadata, String uploadId);
    List<Integer> resumeUpload(String uploadId);
    PageResult<MetadataEntity> getFilesByFilter(PageRequestDto<UserFileFilterPageRequestDto> input);
}
