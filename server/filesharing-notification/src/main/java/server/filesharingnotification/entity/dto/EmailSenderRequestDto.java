package server.filesharingnotification.entity.dto;

import lombok.Data;

@Data
public class EmailSenderRequestDto {
    private String fromUser;

    private String toEmail;

    private String uploadLink;

    private String objectName;

    private String shareToken;

}
