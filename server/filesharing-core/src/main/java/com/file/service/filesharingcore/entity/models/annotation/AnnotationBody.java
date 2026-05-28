package com.file.service.filesharingcore.entity.models.annotation;

import lombok.Data;

import java.util.List;

@Data
public class AnnotationBody {
    private String body;
    private List<UserMention> userMentions;
}
