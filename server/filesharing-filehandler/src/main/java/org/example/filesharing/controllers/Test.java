package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.dtos.metadata.DownloadFileRequestDto;
import org.example.filesharing.jobs.kafka.VideoEncodeProducer;
import org.example.filesharing.services.MinIoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/test")
@RequiredArgsConstructor
@Slf4j
public class Test {

    private final VideoEncodeProducer videoEncodeProducer;
    private final MinIoService minIoService;

    private static final String urlTest = "http://localhost:9000/file-sharing/42d4dde3-66df-4215-a618-33978c3c1b3e_ruabat.mp4?response-content-disposition=attachment%3B%20filename%3D%22null%22&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=20YG284ICBVC7BL4I4LA%2F20260406%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260406T232947Z&X-Amz-Expires=2400&X-Amz-SignedHeaders=host&X-Amz-Signature=c225655e9b0cbfd1399800057ef92ea71c3da515d7db8799923a68bf8d2f1fba";

    @GetMapping(value = "/encode-video")
    public ResponseEntity encodeVideo() {
        DownloadFileRequestDto requestDto = new DownloadFileRequestDto();
        requestDto.setObjectName("42d4dde3-66df-4215-a618-33978c3c1b3e_ruabat.mp4");
        try {
            String url = minIoService.getPresignedDownloadUrl(requestDto, Double.valueOf(30));
            videoEncodeProducer.sendPreSignedUrlViaKafka(url);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return ResponseEntity.ok().build();
    }
}
