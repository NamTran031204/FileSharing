package com.file.service.filesharingimagecodec.vips;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * kết quả của một hoạt động xử lý ảnh đơn lẻ (ảnh thu nhỏ hoặc ảnh xem trước).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VipsResult {
    private String fileName;
    private byte[] data;
    private String contentType;
}
