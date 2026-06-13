package org.example.filesharing.services;

import org.example.filesharing.entities.dtos.processing.PlaybackDataResponseDto;
import org.example.filesharing.entities.dtos.processing.ProcessingJobCreateDTO;
import org.example.filesharing.entities.dtos.processing.ProcessingStatusResponseDto;
import com.file.service.filesharing.core.entity.models.MediaRenditionEntity;
import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;

import java.io.InputStream;
import java.util.List;

public interface ProcessingService {

    void createPendingJob(ProcessingJobCreateDTO job);

    ProcessingStatusResponseDto getProcessingStatus(String assetId, Integer versionNumber);

    PlaybackDataResponseDto getPlaybackData(String assetId, Integer versionNumber);

    List<MediaRenditionEntity> getRenditions(String assetId, Integer versionNumber);

    ProcessingJobEntity getJob(String jobId);

    ProcessingJobEntity cancelJob(String jobId);

    String getHlsManifest(String assetId, Integer versionNumber);

    InputStream getHlsSegment(String assetId, Integer versionNumber, String filename) throws Exception;
}
