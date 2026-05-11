package com.file.service.filesharingimagecodec.vips;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * các tuỳ chọn cho các hoạt động của VipsProcessor.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VipsOptions {
    private int thumbnailWidth;
    private int quality;
    private boolean stripMetadata;
}
