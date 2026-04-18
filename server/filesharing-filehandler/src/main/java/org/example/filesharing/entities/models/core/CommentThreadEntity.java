package org.example.filesharing.entities.models.core;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.example.filesharing.entities.models.CommentMessage;
import org.example.filesharing.enums.ThreadStatus;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "comment_threads")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class CommentThreadEntity {
    @Id
    private String threadId;

    private String assetId;
    private String versionId;
    private List<String> annotations;

    private CommentMessage rootComment;
    private List<CommentMessage> replies;

    private Integer replyCount;
    private List<String> participants;
    private Instant lastActivityAt;

    private ThreadStatus status;
    private Instant resolvedAt;
    private String resolvedBy;
    private Boolean isActive;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}