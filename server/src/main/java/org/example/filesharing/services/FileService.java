package org.example.filesharing.services;

import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.file.UserFileFilterPageRequestDto;
import org.example.filesharing.entities.models.MetadataEntity;

public interface FileService {
    PageResult<MetadataEntity> getPageFileByUser(PageRequestDto<UserFileFilterPageRequestDto> input, Long userId);
}
