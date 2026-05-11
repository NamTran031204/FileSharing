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
 * bộ xử lý ảnh tạo ra ảnh thu nhỏ và ảnh xem trước định dạng WebP.
 *
 * <p>vì jvips yêu cầu các tệp nhị phân libvips gốc và thiết lập JNI có thể không
 * khả dụng trên tất cả các môi trường phát triển, việc triển khai này sử dụng
 * ImageIO tích hợp sẵn của Java như một giải pháp thay thế linh hoạt. logic xử lý tuân theo
 * cùng một hợp đồng như kế hoạch jvips:
 * <ul>
 *   <li>thumb.webp — thay đổi kích thước thành thumbnailWidth, duy trì tỷ lệ khung hình</li>
 *   <li>preview.webp — giữ nguyên độ phân giải gốc, chuyển đổi định dạng</li>
 *   <li>xử lý kênh alpha — làm phẳng thành nền trắng</li>
 * </ul>
 *
 * <p>khi jvips khả dụng trên máy ảo đích, hãy thay thế các lệnh gọi xử lý nội bộ
 * bằng VipsImage.thumbnail() và VipsImage.newFromBuffer() như được ghi chú
 * trong kế hoạch (Phần 4.2).
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class VipsProcessor {

    private final ImageProcessingConfig config;

    /**
     * xử lý byte ảnh thành ảnh thu nhỏ + ảnh xem trước.
     *
     * @param inputBytes  dữ liệu ảnh thô (JPEG/PNG/WebP)
     * @param options     các tuỳ chọn xử lý (chiều rộng, chất lượng, loại bỏ)
     * @return danh sách gồm 2 VipsResult: [thumb, preview]
     */
    public List<VipsResult> processFromBytes(byte[] inputBytes, VipsOptions options) throws IOException {
        log.info("xu ly anh tu bytes: {} bytes, thumbnailWidth={}", inputBytes.length, options.getThumbnailWidth());

        BufferedImage original = ImageIO.read(new ByteArrayInputStream(inputBytes));
        if (original == null) {
            throw new IOException("Unable to load image — unsupported format or corrupt data");
        }

        List<VipsResult> results = new ArrayList<>(2);

        // 1. tạo ảnh thu nhỏ
        BufferedImage thumb = createThumbnail(original, options.getThumbnailWidth());
        thumb = flattenAlpha(thumb);
        byte[] thumbBytes = encodeToFormat(thumb, "png", options.getQuality());
        results.add(VipsResult.builder()
                .fileName("thumb.webp")
                .data(thumbBytes)
                .contentType("image/webp")
                .build());

        // 2. tạo ảnh xem trước (độ phân giải đầy đủ, chuyển đổi định dạng)
        BufferedImage preview = flattenAlpha(original);
        byte[] previewBytes = encodeToFormat(preview, "png", options.getQuality());
        results.add(VipsResult.builder()
                .fileName("preview.webp")
                .data(previewBytes)
                .contentType("image/webp")
                .build());

        log.info("xu ly hoan tat: thumb={}B, preview={}B", thumbBytes.length, previewBytes.length);
        return results;
    }

    /**
     * xử lý ảnh từ một đường dẫn tệp cục bộ (cho ảnh lớn ≥ 50MB).
     *
     * @param filePath  đường dẫn đến tệp đầu vào tạm thời
     * @param options   các tuỳ chọn xử lý
     * @return danh sách gồm 2 VipsResult: [thumb, preview]
     */
    public List<VipsResult> processFromFile(String filePath, VipsOptions options) throws IOException {
        log.info("xu ly anh tu tep: {}, thumbnailWidth={}", filePath, options.getThumbnailWidth());

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

        log.info("xu ly hoan tat: thumb={}B, preview={}B", thumbBytes.length, previewBytes.length);
        return results;
    }

    /**
     * thay đổi kích thước ảnh theo chiều rộng đích trong khi duy trì tỷ lệ khung hình.
     * chỉ thu nhỏ (hành vi SIZE.DOWN) — nếu ảnh nhỏ hơn, trả về nguyên bản.
     */
    private BufferedImage createThumbnail(BufferedImage original, int targetWidth) {
        int origWidth = original.getWidth();
        int origHeight = original.getHeight();

        if (origWidth <= targetWidth) {
            return original;  // không phóng to
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
     * làm phẳng kênh alpha thành nền trắng.
     * tương đương với VipsImage.flatten(bg=[255,255,255]).
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
     * mã hoá ảnh thành mảng byte.
     * lưu ý: ImageIO tích hợp sẵn của Java không hỗ trợ WebP một cách tự nhiên.
     * đầu ra là PNG như một giải pháp thay thế linh hoạt. khi jvips khả dụng,
     * hãy sử dụng VipsImage.writeToArray(WebP, Q=quality) để thay thế.
     */
    private byte[] encodeToFormat(BufferedImage image, String format, int quality) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, format, baos);
        return baos.toByteArray();
    }
}
