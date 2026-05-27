package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.dtos.metadata.DownloadFileRequestDto;
import org.example.filesharing.entities.dtos.processing.PlaybackDataResponseDto;
import org.example.filesharing.entities.dtos.processing.ProcessingJobCreateDTO;
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
import org.example.filesharing.utils.StringUtils;
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
    public void createPendingJob(ProcessingJobCreateDTO job) {
        ProcessingJobEntity ent = ProcessingJobEntity.builder()
                .jobType(job.getJobType() != null ? job.getJobType() : null)
                .objectName(job.getObjectName())
                .metadataId(StringUtils.isNotNullOrBlank(job.getMetadataId()) ? job.getMetadataId() : null)
                .assetId(StringUtils.isNotNullOrBlank(job.getAssetId()) ? job.getAssetId() : null)
                .versionNumber(job.getVersionNumber() != null ? job.getVersionNumber() : null)
                .status(ProcessingJobStatus.PENDING)
                .priority(job.getPriority() != null ? job.getPriority() : 1)
                .scheduledAt(Instant.now())
                .build();

        processingJobRepo.save(ent);
    }

    @Override
    public ProcessingStatusResponseDto getProcessingStatus(String assetId, Integer versionNumber) {
        MetadataEntity version = assetService.getVersion(assetId, versionNumber);
        ProcessingJobEntity job = processingJobRepo.findById(version.getFileId()).orElse(null);

        String errorMessage = version.getProcessingError();
        if (errorMessage == null && job != null && job.getResult() != null) {
            errorMessage = job.getResult().getErrorMessage();
        }

        return ProcessingStatusResponseDto.builder()
                .versionNumber(version.getVersionNumber())
                .processingStatus(version.getProcessingStatus())
                .jobStatus(job != null ? job.getStatus() : null)
                .progress(job != null ? job.getProgress() : null)
                .errorMessage(errorMessage)
                .build();
    }

    @Override
    public PlaybackDataResponseDto getPlaybackData(String assetId, Integer versionNumber) {
        MetadataEntity version = assetService.getVersion(assetId, versionNumber);

        if (version.getStatus() != UploadStatus.COMPLETED) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "version is not completed");
        }

        if (version.getMediaType() == MediaType.VIDEO) {
            ProcessingStatus processingStatus = version.getProcessingStatus();
            if (processingStatus == ProcessingStatus.READY) {
                MediaRenditionEntity hlsRendition = mediaRenditionRepo
                        .findFirstByMetadataIdAndRenditionType(version.getFileId(), RenditionType.HLS)
                        .orElse(null);

                return PlaybackDataResponseDto.builder()
                        .versionNumber(version.getVersionNumber())
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
                    .versionNumber(version.getVersionNumber())
                    .assetId(version.getAssetId())
                    .processingStatus(processingStatus)
                    .build();
        }

        String imageUrl = resolveDownloadUrl(version);
        return PlaybackDataResponseDto.builder()
                .versionNumber(version.getVersionNumber())
                .assetId(version.getAssetId())
                .processingStatus(version.getProcessingStatus())
                .imageUrl(imageUrl)
                .build();
    }

    @Override
    public List<MediaRenditionEntity> getRenditions(String assetId, Integer versionNumber) {
        MetadataEntity version = assetService.getVersion(assetId, versionNumber);
        return mediaRenditionRepo.findByMetadataId(version.getFileId());
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

        String metadataId = job.getMetadataId() != null ? job.getMetadataId() : job.getJobId();
        metadataRepo.findById(metadataId).ifPresent(version -> {
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
