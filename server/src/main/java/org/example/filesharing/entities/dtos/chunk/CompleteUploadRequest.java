package org.example.filesharing.entities.dtos.chunk;

import lombok.Data;
import org.example.filesharing.services.impl.MinIoServiceImpl;

import java.util.List;

@Data
public class CompleteUploadRequest {
    private String objectName;
    private String uploadId;
    private List<MinIoServiceImpl.PartInfo> parts;
}
