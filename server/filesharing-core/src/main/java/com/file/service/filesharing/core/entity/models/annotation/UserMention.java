package com.file.service.filesharing.core.entity.models.annotation;

import lombok.Data;

@Data
public class UserMention {
    private String userId;
    private String userName;
    private Integer start;
    private Integer end;
    // start,end là char bắt đầu và kết thúc trong 1 string mention, ví dụ '@Nam làm việc này nhé' thì start=0, end=3
}
