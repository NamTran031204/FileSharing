package org.example.filesharing.entities.models;

import lombok.*;
import org.example.filesharing.entities.models.annotation.AnnotationBody;
import org.example.filesharing.entities.models.annotation.ShapeInfo;
import org.example.filesharing.entities.models.annotation.AnnotationTimeCode;
import org.example.filesharing.entities.models.base.EntityAuditBase;
import org.example.filesharing.enums.AnnotationStatus;
import org.example.filesharing.enums.MediaType;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;


@Document(collection = "annotations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class AnnotationsEntity extends EntityAuditBase {
    @Id
    private String annotationId;
    private String assetId;
    private Integer versionNumber;

    private AnnotationBody commentBody;
    private String authorId;

    private MediaType mediaType;

    // danh rieng cho video
    private AnnotationTimeCode timeCode;
    private Integer frameNumber;

    private List<ShapeInfo> region;

    // status
    private AnnotationStatus status;
    private Instant resolvedAt;
    private String resolvedBy;

    private String threadId;
    private String parentCommentId;      // null = root
    private String threadRootId; // = null neu la root

    private Integer replyCount; // tong so reply hien co (chi root comment moi co gia tri nay)

}