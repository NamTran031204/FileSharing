package org.example.filesharing.controllers;

import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.file.EmailSenderRequestDto;
import org.example.filesharing.entities.dtos.file.UserFileFilterPageRequestDto;
import org.example.filesharing.entities.dtos.metadata.MetadataUpdateRequestDto;
import org.example.filesharing.entities.models.MetadataEntity;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.services.EmailService;
import org.example.filesharing.services.MetadataService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/file")
@RequiredArgsConstructor
@Slf4j
public class FileController {

    private final MetadataService metadataService;
    private final EmailService emailService;

    @PostMapping("get-page")
    public CommonResponse<PageResult<MetadataEntity>> getFileByData(@RequestBody PageRequestDto<UserFileFilterPageRequestDto> input) {
        return CommonResponse.success(metadataService.getFilesByFilter(input));
    }

    @PostMapping("/send-email")
    public CommonResponse<String> sendEmail(@RequestBody EmailSenderRequestDto input) {
        try {
            metadataService.addUserViaEmail(input.getObjectName(), input.getToEmail(), input.getObjectPermission());
            emailService.sendDownloadLinkViaEmail(input);
        } catch (MessagingException e) {
            throw new RuntimeException(e);
        }
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
