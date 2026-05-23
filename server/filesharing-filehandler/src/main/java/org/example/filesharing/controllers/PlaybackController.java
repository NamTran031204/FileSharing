package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.dtos.processing.PlaybackDataResponseDto;
import org.example.filesharing.entities.models.MediaRenditionEntity;
import org.example.filesharing.services.ProcessingService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("api/versions")
@RequiredArgsConstructor
public class PlaybackController {

    private final ProcessingService processingService;

    @GetMapping("/{assetId}/{versionNumber}/playback")
    public CommonResponse<PlaybackDataResponseDto> getPlaybackData(@PathVariable("assetId") String assetId,
                                                                   @PathVariable("versionNumber") Integer versionNumber) {
        return CommonResponse.success(processingService.getPlaybackData(assetId, versionNumber));
    }

    @GetMapping("/{assetId}/{versionNumber}/renditions")
    public CommonResponse<List<MediaRenditionEntity>> getRenditions(@PathVariable("assetId") String assetId,
                                                                    @PathVariable("versionNumber") Integer versionNumber) {
        return CommonResponse.success(processingService.getRenditions(assetId, versionNumber));
    }
}
