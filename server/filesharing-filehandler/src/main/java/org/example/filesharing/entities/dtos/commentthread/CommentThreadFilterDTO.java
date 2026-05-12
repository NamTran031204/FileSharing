package org.example.filesharing.entities.dtos.commentthread;

import lombok.Data;
import org.example.filesharing.enums.ThreadStatus;

import java.time.Instant;

@Data
public class CommentThreadFilterDTO {
    private String assetId;
    private Integer versionNumber;
    private String annotationId;
    private String participant;
    private String createdBy;
    private String keyword;
    private ThreadStatus status;
    private Instant fromLastActivityAt;
    private Instant toLastActivityAt;
}
