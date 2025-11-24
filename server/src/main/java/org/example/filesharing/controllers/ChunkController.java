package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.ChunkRequest;
import org.example.filesharing.services.ChunkService;
import org.example.filesharing.services.MinIoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/chunk")
@RequiredArgsConstructor
public class ChunkController {

    private final MinIoService minIoService;

    @PostMapping("/create-upload-url")
    public ResponseEntity<?> saveChunk(@RequestBody ChunkRequest input) {
        String url = minIoService.getPresignedUrlForPart(input.getChunkName(), input.getUploadId(), input.getPart());
        return ResponseEntity.ok(url);
    }
}
