package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.AssetEntity;
import com.file.service.filesharing.core.enums.ProcessingJobType;
import com.file.service.filesharing.core.job.relay.JobResultMessage;
import com.file.service.filesharing.core.job.relay.JobResultStatus;
import com.mongodb.client.result.UpdateResult;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.repositories.MediaRenditionRepo;
import org.example.filesharing.services.SseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

/** DBG-1: SSE phai duoc ban cho ca job TRANSCODE_HLS (video), khong chi job anh. */
class JobResultServiceImplTest {

    private MongoTemplate mongoTemplate;
    private MediaRenditionRepo mediaRenditionRepo;
    private AssetRepo assetRepo;
    private SseService sseService;
    private JobResultServiceImpl service;

    @BeforeEach
    void setUp() {
        mongoTemplate = mock(MongoTemplate.class);
        mediaRenditionRepo = mock(MediaRenditionRepo.class);
        assetRepo = mock(AssetRepo.class);
        sseService = mock(SseService.class);
        service = new JobResultServiceImpl(mongoTemplate, mediaRenditionRepo, assetRepo, sseService);

        UpdateResult matched = mock(UpdateResult.class);
        when(matched.getMatchedCount()).thenReturn(1L);
        when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), eq(com.file.service.filesharing.core.entity.models.MetadataEntity.class)))
                .thenReturn(matched);

        var metadata = com.file.service.filesharing.core.entity.models.MetadataEntity.builder()
                .assetId("asset-1").build();
        when(mongoTemplate.findById("meta-1", com.file.service.filesharing.core.entity.models.MetadataEntity.class))
                .thenReturn(metadata);

        AssetEntity asset = new AssetEntity();
        asset.setFolderId("folder-1");
        when(assetRepo.findById("asset-1")).thenReturn(java.util.Optional.of(asset));
    }

    private JobResultMessage video(JobResultStatus status) {
        return JobResultMessage.builder()
                .jobId("job-1").attemptId("attempt-1").jobType(ProcessingJobType.TRANSCODE_HLS)
                .metadataId("meta-1").assetId("asset-1").status(status)
                .manifestKey(status == JobResultStatus.SUCCEEDED ? "obj/attempt-1/index.m3u8" : null)
                .build();
    }

    @Test
    void videoSuccess_pushesSseWithReadyStatus() {
        service.apply(video(JobResultStatus.SUCCEEDED));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<java.util.Map<String, Object>> captor = ArgumentCaptor.forClass(java.util.Map.class);
        verify(sseService, times(1)).sendAssetStatusUpdate(eq("folder-1"), captor.capture());
        assertEquals("READY", String.valueOf(captor.getValue().get("newStatus")));
        verify(mediaRenditionRepo, times(1)).save(any());
    }

    @Test
    void videoFailure_stillPushesSse() {
        service.apply(video(JobResultStatus.FAILED));

        verify(sseService, times(1)).sendAssetStatusUpdate(eq("folder-1"), any());
        verify(mediaRenditionRepo, never()).save(any());
    }
}
