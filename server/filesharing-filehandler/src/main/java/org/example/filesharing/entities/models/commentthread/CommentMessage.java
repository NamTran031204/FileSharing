package org.example.filesharing.entities.models.commentthread;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentMessage {
    private String commentId;
    private String replyToComment;
    private String content;
    private List<String> mentions;
    private List<CommentAttachment> attachments;
    private String createdBy;
    private String createdByEmail;
    private String createdByName;
    private Instant createdAt;
    private Instant editedAt;
}