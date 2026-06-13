package org.example.filesharing.entities.dtos.annotations;

import lombok.Data;
import com.file.service.filesharing.core.entity.models.annotation.AnnotationBody;
import com.file.service.filesharing.core.entity.models.annotation.AnnotationTimeCode;
import com.file.service.filesharing.core.entity.models.annotation.ShapeInfo;
import com.file.service.filesharing.core.enums.MediaType;

import java.util.List;

@Data
public class AnnotationCreateDTO {
    private String assetId;
    private Integer versionNumber;
    private AnnotationBody commentBody;
    private MediaType mediaType;
    private List<ShapeInfo> region;
    private AnnotationTimeCode timeCode;
    private Integer frameNumber;
    private String parentCommentId;
}
