package org.example.filesharing.entities.dtos.commentthread;

import lombok.Data;
import org.example.filesharing.entities.models.commentthread.CommentMessage;
import org.example.filesharing.enums.ThreadStatus;

import java.util.List;

@Data
public class CommentThreadCreateUpdateDTO {
    private String threadId;
    private String assetId;
    private Integer versionNumber;
    private List<String> annotations;
    private CommentMessage rootComment;
    private List<CommentMessage> replies;
    private ThreadStatus status;
}
