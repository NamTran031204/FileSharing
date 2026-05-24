package org.example.filesharing.entities.dtos.annotations;

import lombok.Data;
import org.example.filesharing.entities.models.annotation.AnnotationBody;
import org.example.filesharing.entities.models.annotation.AnnotationTimeCode;
import org.example.filesharing.entities.models.annotation.ShapeInfo;
import org.example.filesharing.enums.MediaType;

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
