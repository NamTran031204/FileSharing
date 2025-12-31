package org.example.filesharing.controllers;

import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.file.EmailSenderRequestDto;
import org.example.filesharing.entities.dtos.file.UserFileFilterPageRequestDto;
import org.example.filesharing.entities.models.MetadataEntity;
import org.example.filesharing.services.EmailService;
import org.example.filesharing.services.MetadataService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/file")
@RequiredArgsConstructor
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
            emailService.sendDownloadLinkViaEmail(input);
        } catch (MessagingException e) {
            throw new RuntimeException(e);
        }
        return CommonResponse.success("Email Send");
    }
}
