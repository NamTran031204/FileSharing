package org.example.filesharing.entities.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.enums.CommentAttachmentType;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentAttachment {
    private CommentAttachmentType type;
    private String fileId;
    private String fileName;
    private Long fileSize;
}