package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.dtos.metadata.DownloadFileRequestDto;
import org.example.filesharing.entities.dtos.processing.PlaybackDataResponseDto;
import org.example.filesharing.entities.dtos.processing.ProcessingStatusResponseDto;
import org.example.filesharing.entities.models.MediaRenditionEntity;
import org.example.filesharing.entities.models.MetadataEntity;
import org.example.filesharing.entities.models.ProcessingJobEntity;
import org.example.filesharing.enums.MediaType;
import org.example.filesharing.enums.ProcessingJobStatus;
import org.example.filesharing.enums.ProcessingStatus;
import org.example.filesharing.enums.RenditionType;
import org.example.filesharing.enums.UploadStatus;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.exceptions.specException.FileBusinessException;
import org.example.filesharing.exceptions.specException.UserBusinessException;
import org.example.filesharing.repositories.MediaRenditionRepo;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.repositories.ProcessingJobRepo;
import org.example.filesharing.services.AssetService;
import org.example.filesharing.services.MinIoService;
import org.example.filesharing.services.ProcessingService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProcessingServiceImpl implements ProcessingService {

    private final AssetService assetService;
    private final ProcessingJobRepo processingJobRepo;
    private final MediaRenditionRepo mediaRenditionRepo;
    private final MetadataRepo metadataRepo;
    private final MinIoService minIoService;

    @Override
    public ProcessingStatusResponseDto getProcessingStatus(String versionId) {
        MetadataEntity version = assetService.getVersionById(versionId);
        ProcessingJobEntity job = processingJobRepo.findById(versionId).orElse(null);

        String errorMessage = version.getProcessingError();
        if (errorMessage == null && job != null && job.getResult() != null) {
            errorMessage = job.getResult().getErrorMessage();
        }

        return ProcessingStatusResponseDto.builder()
                .versionId(version.getFileId())
                .processingStatus(version.getProcessingStatus())
                .jobStatus(job != null ? job.getStatus() : null)
                .progress(job != null ? job.getProgress() : null)
                .errorMessage(errorMessage)
                .build();
    }

    @Override
    public PlaybackDataResponseDto getPlaybackData(String versionId) {
        MetadataEntity version = assetService.getVersionById(versionId);

        if (version.getStatus() != UploadStatus.COMPLETED) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "version is not completed");
        }

        if (version.getMediaType() == MediaType.VIDEO) {
            ProcessingStatus processingStatus = version.getProcessingStatus();
            if (processingStatus == ProcessingStatus.READY) {
                MediaRenditionEntity hlsRendition = mediaRenditionRepo
                        .findFirstByVersionIdAndRenditionType(version.getFileId(), RenditionType.HLS)
                        .orElse(null);

                return PlaybackDataResponseDto.builder()
                        .versionId(version.getFileId())
                        .assetId(version.getAssetId())
                        .processingStatus(processingStatus)
                        .manifestKey(hlsRendition != null ? hlsRendition.getManifestKey() : null)
                        .posterKey(hlsRendition != null ? hlsRendition.getPosterKey() : null)
                        .spriteKey(hlsRendition != null ? hlsRendition.getSpriteKey() : null)
                        .spriteMetadataKey(hlsRendition != null ? hlsRendition.getSpriteMetadataKey() : null)
                        .build();
            }

            if (processingStatus == ProcessingStatus.FAILED) {
                throw new FileBusinessException(ErrorCode.FILE_ERROR, "PROCESSING_FAILED");
            }

            return PlaybackDataResponseDto.builder()
                    .versionId(version.getFileId())
                    .assetId(version.getAssetId())
                    .processingStatus(processingStatus)
                    .build();
        }

        String imageUrl = resolveDownloadUrl(version);
        return PlaybackDataResponseDto.builder()
                .versionId(version.getFileId())
                .assetId(version.getAssetId())
                .processingStatus(version.getProcessingStatus())
                .imageUrl(imageUrl)
                .build();
    }

    @Override
    public List<MediaRenditionEntity> getRenditions(String versionId) {
        MetadataEntity version = assetService.getVersionById(versionId);
        return mediaRenditionRepo.findByVersionId(version.getFileId());
    }

    @Override
    public ProcessingJobEntity getJob(String jobId) {
        return processingJobRepo.findById(jobId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.NOT_FOUND, "processing job not found"));
    }

    @Override
    public ProcessingJobEntity cancelJob(String jobId) {
        ProcessingJobEntity job = processingJobRepo.findById(jobId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.NOT_FOUND, "processing job not found"));

        if (job.getStatus() == ProcessingJobStatus.PROCESSING) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "cannot cancel a processing job");
        }

        job.setStatus(ProcessingJobStatus.CANCELLED);
        job.setCompletedAt(Instant.now());
        if (job.getResult() != null) {
            job.getResult().setSuccess(false);
            job.getResult().setErrorMessage("CANCELLED");
        }

        ProcessingJobEntity saved = processingJobRepo.save(job);

        String versionId = job.getVersionId() != null ? job.getVersionId() : job.getJobId();
        metadataRepo.findById(versionId).ifPresent(version -> {
            version.setProcessingStatus(ProcessingStatus.FAILED);
            version.setProcessingError("CANCELLED");
            version.setProcessingCompleteAt(Instant.now());
            metadataRepo.save(version);
        });

        return saved;
    }

    private String resolveDownloadUrl(MetadataEntity version) {
        try {
            DownloadFileRequestDto input = new DownloadFileRequestDto();
            input.setObjectName(version.getObjectName());
            return minIoService.getPresignedDownloadUrl(input, version.getFileSize());
        } catch (Exception e) {
            log.error("Failed to create download URL for version {}: {}", version.getFileId(), e.getMessage(), e);
            throw new RuntimeException("Failed to create download URL", e);
        }
    }
}
