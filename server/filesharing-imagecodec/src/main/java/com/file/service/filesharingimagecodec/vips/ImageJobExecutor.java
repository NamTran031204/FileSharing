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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/** Phan rieng cua imagecodec: tao thumb + preview tu file anh. Moi thu con lai do runtime trong core lo. */
@Component
@Slf4j
@RequiredArgsConstructor
public class ImageJobExecutor implements JobExecutor {

    private final ImageProcessingConfig config;
    private final VipsProcessor vipsProcessor;
    private final MinioStorageClient storageClient;

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

    @Override
    public JobExecution process(JobContext ctx) throws PermanentJobException, TransientJobException {
        Path input = ctx.inputFile();
        String objectName = ctx.job().getObjectName();
        try {
            if (Files.size(input) == 0) {
                throw new PermanentJobException("file anh 0 byte");
            }
            checkPixels(input);
            ctx.reportProgress(20, "PROCESSING");

            VipsOptions options = VipsOptions.builder()
                    .thumbnailWidth(config.getOutput().getThumbnailWidth())
                    .quality(config.getOutput().getWebpQuality())
                    .stripMetadata(config.getOutput().isStripMetadata())
                    .build();
            List<VipsResult> results = runWithTimeout(input, options);

            Path thumbFile = write(ctx, results, "thumb.webp");
            Path previewFile = write(ctx, results, "preview.webp");
            ctx.reportProgress(80, "UPLOADING");
            return new JobExecution(List.of(
                    new OutputObject(thumbnailBucket, objectName, thumbFile, "image/webp", false),
                    new OutputObject(previewBucket, objectName, previewFile, "image/webp", false)),
                    null, storageClient.buildThumbnailPublicUrl(objectName), null);
        } catch (IOException e) {
            // file da tai ve nhung khong doc duoc: coi la dau vao hong
            throw new PermanentJobException("khong doc duoc anh: " + e.getMessage(), e);
        }
    }

    private List<VipsResult> runWithTimeout(Path input, VipsOptions options)
            throws IOException, PermanentJobException, TransientJobException {
        int timeout = config.getVips().getProcessingTimeoutSeconds();
        try {
            return CompletableFuture.supplyAsync(() -> {
                try {
                    return vipsProcessor.processFromFile(input.toString(), options);
                } catch (Exception e) {
                    throw new CompletionException(e);
                }
            }, r -> Thread.ofVirtual().start(r)).orTimeout(timeout, TimeUnit.SECONDS).join();
        } catch (CompletionException e) {
            Throwable c = e.getCause();
            while (c instanceof CompletionException && c.getCause() != null) c = c.getCause();
            if (c instanceof TimeoutException) {
                throw new TransientJobException("xu ly anh qua " + timeout + "s");
            }
            if (c instanceof PermanentJobException p) throw p;
            if (c instanceof IOException io) throw io;
            throw new TransientJobException(String.valueOf(c.getMessage()), c);
        }
    }

    // Doc width x height tu header, khong decode
    private void checkPixels(Path input) throws IOException, PermanentJobException {
        try (ImageInputStream in = ImageIO.createImageInputStream(input.toFile())) {
            Iterator<ImageReader> readers = in == null ? null : ImageIO.getImageReaders(in);
            if (readers == null || !readers.hasNext()) {
                throw new PermanentJobException("dinh dang anh khong duoc ho tro hoac file hong");
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(in);
                long pixels = (long) reader.getWidth(0) * reader.getHeight(0);
                long max = config.getVips().getMaxPixels();
                if (max > 0 && pixels > max) {
                    throw new PermanentJobException("anh qua lon: " + pixels + " pixel, toi da " + max);
                }
            } finally {
                reader.dispose();
            }
        }
    }

    private Path write(JobContext ctx, List<VipsResult> results, String name) throws IOException, PermanentJobException {
        VipsResult r = results.stream().filter(x -> x.getFileName().equals(name)).findFirst()
                .orElseThrow(() -> new PermanentJobException(name + " khong co trong ket qua xu ly"));
        Path out = ctx.workspace().resolve("out-" + name);
        Files.write(out, r.getData());
        return out;
    }
}
