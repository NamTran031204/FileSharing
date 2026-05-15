package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.commentthread.CommentThreadCreateUpdateDTO;
import org.example.filesharing.entities.dtos.commentthread.CommentThreadFilterDTO;
import org.example.filesharing.entities.models.CommentThreadEntity;
import org.example.filesharing.services.CommentThreadService;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RequestMapping("api/comment-thread")
@RestController
public class CommentThreadController {

    private final CommentThreadService commentThreadService;

    @PostMapping("/create-new")
    public CommonResponse<CommentThreadEntity> createNewCommentThread(@RequestBody CommentThreadCreateUpdateDTO dto) {
        return CommonResponse.success(commentThreadService.createNewCommentThread(dto));
    }

    @PostMapping("/update-detail")
    public CommonResponse<CommentThreadEntity> updateCommentThreadDetail(@RequestBody CommentThreadCreateUpdateDTO dto) {
        return CommonResponse.success(commentThreadService.updateCommentThreadDetail(dto));
    }

    @PostMapping("/get-page")
    public CommonResponse<PageResult<CommentThreadEntity>> getCommentThreadPage(
            @RequestBody PageRequestDto<CommentThreadFilterDTO> dto) {
        return CommonResponse.success(commentThreadService.getCommentThreadPage(dto));
    }

    @GetMapping("/get-by-id/{threadId}")
    public CommonResponse<CommentThreadEntity> getCommentThreadById(@PathVariable("threadId") String threadId) {
        return CommonResponse.success(commentThreadService.getCommentThreadById(threadId));
    }

    @PostMapping("/delete/{threadId}")
    public CommonResponse<String> deleteCommentThread(@PathVariable("threadId") String threadId) {
        return CommonResponse.success(commentThreadService.deleteCommentThread(threadId));
    }
}
