package org.example.filesharing.services;

import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.commentthread.CommentThreadCreateUpdateDTO;
import org.example.filesharing.entities.dtos.commentthread.CommentThreadFilterDTO;
import org.example.filesharing.entities.models.core.CommentThreadEntity;
import org.example.filesharing.services.baseService.BaseAuditService;

public interface CommentThreadService {
    CommentThreadEntity createNewCommentThread(CommentThreadCreateUpdateDTO dto);

    CommentThreadEntity updateCommentThreadDetail(CommentThreadCreateUpdateDTO dto);

    PageResult<CommentThreadEntity> getCommentThreadPage(PageRequestDto<CommentThreadFilterDTO> dto);

    CommentThreadEntity getCommentThreadById(String threadId);

    String deleteCommentThread(String threadId);
}
