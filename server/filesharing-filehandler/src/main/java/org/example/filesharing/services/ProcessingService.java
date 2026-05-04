package org.example.filesharing.services;

import org.example.filesharing.entities.dtos.processing.PlaybackDataResponseDto;
import org.example.filesharing.entities.dtos.processing.ProcessingStatusResponseDto;
import org.example.filesharing.entities.models.core.MediaRenditionEntity;
import org.example.filesharing.entities.models.core.ProcessingJobEntity;

import java.util.List;

public interface ProcessingService {
    ProcessingStatusResponseDto getProcessingStatus(String versionId);

    PlaybackDataResponseDto getPlaybackData(String versionId);

    List<MediaRenditionEntity> getRenditions(String versionId);

    ProcessingJobEntity getJob(String jobId);

    ProcessingJobEntity cancelJob(String jobId);
}
