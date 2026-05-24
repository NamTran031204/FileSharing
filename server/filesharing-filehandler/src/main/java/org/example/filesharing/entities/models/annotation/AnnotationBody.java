package org.example.filesharing.entities.models.annotation;

import lombok.Data;

import java.util.List;

@Data
public class AnnotationBody {
    private String body;
    private List<UserMention> userMentions;
}
