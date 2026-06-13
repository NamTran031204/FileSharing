package org.example.filesharing.services;

import com.file.service.filesharing.core.entity.PageRequestDto;
import com.file.service.filesharing.core.entity.PageResult;
import org.example.filesharing.entities.dtos.file.UserFileFilterPageRequestDto;
import com.file.service.filesharing.core.entity.models.MetadataEntity;

public interface FileService {
    PageResult<MetadataEntity> getPageFileByUser(PageRequestDto<UserFileFilterPageRequestDto> input, Long userId);
}
