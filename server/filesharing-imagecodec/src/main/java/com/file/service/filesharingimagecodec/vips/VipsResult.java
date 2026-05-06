package com.file.service.filesharingimagecodec.vips;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Result of a single image processing operation (thumbnail or preview).
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
