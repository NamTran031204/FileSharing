package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.dtos.processing.PlaybackDataResponseDto;
import org.example.filesharing.entities.models.MediaRenditionEntity;
import org.example.filesharing.services.ProcessingService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.InputStream;
import java.util.List;

@RestController
@RequestMapping("api/versions")
@RequiredArgsConstructor
@Slf4j
public class PlaybackController {

    private static final MediaType HLS_MEDIA_TYPE =
            MediaType.parseMediaType("application/vnd.apple.mpegurl");
    private static final MediaType TS_MEDIA_TYPE =
            MediaType.parseMediaType("video/mp2t");
    private static final String SAFE_SEGMENT_PATTERN = "[a-zA-Z0-9_-]+\\.ts";

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

    @GetMapping(value = "/{assetId}/{versionNumber}/hls/manifest",
                produces = "application/vnd.apple.mpegurl")
    public ResponseEntity<String> getHlsManifest(@PathVariable("assetId") String assetId,
                                                 @PathVariable("versionNumber") Integer versionNumber) {
        String manifest = processingService.getHlsManifest(assetId, versionNumber);
        return ResponseEntity.ok()
                .contentType(HLS_MEDIA_TYPE)
                .body(manifest);
    }

    @GetMapping("/{assetId}/{versionNumber}/hls/segment/{filename}")
    public ResponseEntity<StreamingResponseBody> getHlsSegment(@PathVariable("assetId") String assetId,
                                                               @PathVariable("versionNumber") Integer versionNumber,
                                                               @PathVariable("filename") String filename) {
        if (!filename.matches(SAFE_SEGMENT_PATTERN)) {
            return ResponseEntity.badRequest().build();
        }

        StreamingResponseBody body = outputStream -> {
            try (InputStream stream = processingService.getHlsSegment(assetId, versionNumber, filename)) {
                stream.transferTo(outputStream);
            } catch (Exception e) {
                log.error("Failed to stream HLS segment {}/{}/{}: {}", assetId, versionNumber, filename, e.getMessage());
                throw new RuntimeException("Segment streaming failed", e);
            }
        };

        return ResponseEntity.ok()
                .contentType(TS_MEDIA_TYPE)
                .body(body);
    }
}
