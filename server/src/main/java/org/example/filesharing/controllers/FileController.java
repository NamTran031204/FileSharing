package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.file.UserFileFilterPageRequestDto;
import org.example.filesharing.entities.models.MetadataEntity;
import org.example.filesharing.services.MetadataService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/file")
@RequiredArgsConstructor
public class FileController {

    private final MetadataService metadataService;

    @PostMapping("get-page")
    public CommonResponse<PageResult<MetadataEntity>> getFileByData(@RequestBody PageRequestDto<UserFileFilterPageRequestDto> input) {
        return CommonResponse.success(metadataService.getFilesByFilter(input));
    }
}
