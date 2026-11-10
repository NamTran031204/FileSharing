package com.file.service.filesharingimagecodec.vips;

import com.file.service.filesharing.core.enums.ProcessingJobType;
import com.file.service.filesharing.core.job.InputMode;
import com.file.service.filesharing.core.job.JobContext;
import com.file.service.filesharing.core.job.JobExecution;
import com.file.service.filesharing.core.job.JobExecutor;
import com.file.service.filesharing.core.job.OutputObject;
import com.file.service.filesharing.core.job.exception.PermanentJobException;
import com.file.service.filesharing.core.job.exception.TransientJobException;
import com.file.service.filesharingimagecodec.config.ImageProcessingConfig;
import com.file.service.filesharingimagecodec.storage.MinioStorageClient;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.util.List;
import java.util.Set;

/**
 * Phan rieng cua imagecodec: PROBE (vipsheader) roi thumb + preview WebP bang vips thumbnail, moi tien trinh qua
 * ctx.exec. Khong giu pixel anh trong heap JVM. Moi thu con lai do runtime trong core lo.
 */
@Component
@RequiredArgsConstructor
public class ImageJobExecutor implements JobExecutor {

    private final ImageProcessingConfig config;
    private final MinioStorageClient storageClient;
    private VipsTool vips;

    @Value("${minio.buckets.thumbnails}")
    private String thumbnailBucket;
    @Value("${minio.buckets.image-preview}")
    private String previewBucket;

    @Override
    public Set<ProcessingJobType> supportedTypes() {
        return Set.of(ProcessingJobType.TRANSCODE_IMAGE);
    }

    @Override
    public InputMode inputMode() {
        return InputMode.DOWNLOAD;
    }

    @PostConstruct
    void verifyTools() {
        vips = new VipsTool(config);
        vips.verify();
    }

    @Override
    public JobExecution process(JobContext ctx) throws PermanentJobException, TransientJobException {
        Path input = ctx.inputFile();
        String objectName = ctx.job().getObjectName();

        VipsTool.Header h;
        try (JobContext.Stage st = ctx.stage("probe", 30, 35)) {
            h = vips.probe(ctx, input);
        }
        ctx.metrics().pixels((long) h.width() * h.height());
        int[] size = VipsTool.displaySize(h);

        Path preview = ctx.workspace().resolve("out-preview.webp");
        Path thumb = ctx.workspace().resolve("out-thumb.webp");
        try (JobContext.Stage st = ctx.stage("process", 35, 80)) {
            vips.preview(ctx, input, preview);
            vips.thumbnail(ctx, input, thumb);
        }
        return new JobExecution(List.of(
                new OutputObject(thumbnailBucket, objectName, thumb, "image/webp", false),
                new OutputObject(previewBucket, objectName, preview, "image/webp", false)),
                null, storageClient.buildThumbnailPublicUrl(objectName), null, size[0], size[1]);
    }
}
