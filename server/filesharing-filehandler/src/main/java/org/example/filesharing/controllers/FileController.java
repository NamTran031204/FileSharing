package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.file.EmailSenderRequestDto;
import org.example.filesharing.entities.dtos.file.UserFileFilterPageRequestDto;
import org.example.filesharing.entities.dtos.metadata.MetadataUpdateRequestDto;
import org.example.filesharing.entities.models.core.MetadataEntity;
import org.example.filesharing.services.MetadataService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/file")
@RequiredArgsConstructor
@Slf4j
public class FileController {

    private final MetadataService metadataService;

    @PostMapping("get-page")
    public CommonResponse<PageResult<MetadataEntity>> getFileByData(@RequestBody PageRequestDto<UserFileFilterPageRequestDto> input) {
        return CommonResponse.success(metadataService.getFilesByFilter(input));
    }

    @PostMapping("/send-email")
    public CommonResponse<String> sendEmail(@RequestBody EmailSenderRequestDto input) {
        metadataService.addUserViaEmail(input);
        return CommonResponse.success("Email Send");
    }

    @PostMapping(value = "/update/{fileId}")
    public CommonResponse<MetadataEntity> updateFileDetail(
            @PathVariable("fileId") String fileId,
            @RequestBody MetadataUpdateRequestDto request) {
        MetadataEntity updatedMetadata = metadataService.updateMetadata(request, fileId);
        return CommonResponse.success(updatedMetadata);
    }
}
