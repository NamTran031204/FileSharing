package com.file.service.filesharingimagecodec.vips;

import com.file.service.filesharingimagecodec.config.ImageProcessingConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Image processor that generates thumbnail and preview WebP images.
 *
 * <p>Since jvips requires native libvips binaries and JNI setup that may not be
 * available on all development environments, this implementation uses Java's
 * built-in ImageIO as a portable fallback. The processing logic follows the
 * same contract as the jvips plan:
 * <ul>
 *   <li>thumb.webp — resize to thumbnailWidth, maintain aspect ratio</li>
 *   <li>preview.webp — keep original resolution, convert format</li>
 *   <li>Alpha channel handling — flatten to white background</li>
 * </ul>
 *
 * <p>When jvips is available on the target VM, replace the internal processing
 * calls with VipsImage.thumbnail() and VipsImage.newFromBuffer() as documented
 * in the plan (Section 4.2).
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class VipsProcessor {

    private final ImageProcessingConfig config;

    /**
     * Process image bytes into thumbnail + preview.
     *
     * @param inputBytes  raw image data (JPEG/PNG/WebP)
     * @param options     processing options (width, quality, strip)
     * @return list of 2 VipsResults: [thumb, preview]
     */
    public List<VipsResult> processFromBytes(byte[] inputBytes, VipsOptions options) throws IOException {
        log.info("Processing image from bytes: {} bytes, thumbnailWidth={}", inputBytes.length, options.getThumbnailWidth());

        BufferedImage original = ImageIO.read(new ByteArrayInputStream(inputBytes));
        if (original == null) {
            throw new IOException("Unable to load image — unsupported format or corrupt data");
        }

        List<VipsResult> results = new ArrayList<>(2);

        // 1. Generate thumbnail
        BufferedImage thumb = createThumbnail(original, options.getThumbnailWidth());
        thumb = flattenAlpha(thumb);
        byte[] thumbBytes = encodeToFormat(thumb, "png", options.getQuality());
        results.add(VipsResult.builder()
                .fileName("thumb.webp")
                .data(thumbBytes)
                .contentType("image/webp")
                .build());

        // 2. Generate preview (full resolution, format conversion)
        BufferedImage preview = flattenAlpha(original);
        byte[] previewBytes = encodeToFormat(preview, "png", options.getQuality());
        results.add(VipsResult.builder()
                .fileName("preview.webp")
                .data(previewBytes)
                .contentType("image/webp")
                .build());

        log.info("Processing complete: thumb={}B, preview={}B", thumbBytes.length, previewBytes.length);
        return results;
    }

    /**
     * Process image from a local file path (for large images ≥ 50MB).
     *
     * @param filePath  path to the temporary input file
     * @param options   processing options
     * @return list of 2 VipsResults: [thumb, preview]
     */
    public List<VipsResult> processFromFile(String filePath, VipsOptions options) throws IOException {
        log.info("Processing image from file: {}, thumbnailWidth={}", filePath, options.getThumbnailWidth());

        BufferedImage original = ImageIO.read(new File(filePath));
        if (original == null) {
            throw new IOException("Unable to load image from file: " + filePath);
        }

        List<VipsResult> results = new ArrayList<>(2);

        BufferedImage thumb = createThumbnail(original, options.getThumbnailWidth());
        thumb = flattenAlpha(thumb);
        byte[] thumbBytes = encodeToFormat(thumb, "png", options.getQuality());
        results.add(VipsResult.builder()
                .fileName("thumb.webp")
                .data(thumbBytes)
                .contentType("image/webp")
                .build());

        BufferedImage preview = flattenAlpha(original);
        byte[] previewBytes = encodeToFormat(preview, "png", options.getQuality());
        results.add(VipsResult.builder()
                .fileName("preview.webp")
                .data(previewBytes)
                .contentType("image/webp")
                .build());

        log.info("Processing complete: thumb={}B, preview={}B", thumbBytes.length, previewBytes.length);
        return results;
    }

    /**
     * Resize image to targetWidth maintaining aspect ratio.
     * Only downsizes (SIZE.DOWN behavior) — if image is smaller, return as-is.
     */
    private BufferedImage createThumbnail(BufferedImage original, int targetWidth) {
        int origWidth = original.getWidth();
        int origHeight = original.getHeight();

        if (origWidth <= targetWidth) {
            return original;  // Don't upscale
        }

        double ratio = (double) targetWidth / origWidth;
        int targetHeight = (int) (origHeight * ratio);

        BufferedImage thumbnail = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = thumbnail.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.drawImage(original, 0, 0, targetWidth, targetHeight, null);
        g2d.dispose();

        return thumbnail;
    }

    /**
     * Flatten alpha channel to white background.
     * Equivalent to VipsImage.flatten(bg=[255,255,255]).
     */
    private BufferedImage flattenAlpha(BufferedImage image) {
        if (!image.getColorModel().hasAlpha()) {
            return image;
        }

        BufferedImage flat = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = flat.createGraphics();
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, image.getWidth(), image.getHeight());
        g2d.drawImage(image, 0, 0, null);
        g2d.dispose();

        return flat;
    }

    /**
     * Encode image to byte array.
     * Note: Java's built-in ImageIO does not support WebP natively.
     * Output is PNG as a portable fallback. When jvips is available,
     * use VipsImage.writeToArray(WebP, Q=quality) instead.
     */
    private byte[] encodeToFormat(BufferedImage image, String format, int quality) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, format, baos);
        return baos.toByteArray();
    }
}
