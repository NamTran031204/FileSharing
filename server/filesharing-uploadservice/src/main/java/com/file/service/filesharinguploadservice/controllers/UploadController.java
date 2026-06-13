package com.file.service.filesharinguploadservice.controllers;

import com.file.service.filesharing.core.entity.CommonResponse;
import com.file.service.filesharinguploadservice.entities.UploadResponseDTO;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/upload")
public class UploadController {

    @PostMapping("/chunks")
    public Mono<CommonResponse<UploadResponseDTO>> uploadChunks(@RequestParam("file") MultipartFile file) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

}
