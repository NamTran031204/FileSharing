package com.file.service.filesharing.core.entity.models.access;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Cai dat quyen; o folder gia tri null nghia la theo cha. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccessSettings {
    private Boolean viewersCanDownload;
}
