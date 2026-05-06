package com.file.service.filesharingimagecodec.vips;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Options for VipsProcessor operations.
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
