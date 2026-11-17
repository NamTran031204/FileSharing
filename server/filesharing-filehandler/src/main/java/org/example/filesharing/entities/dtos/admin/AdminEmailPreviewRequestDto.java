package org.example.filesharing.entities.dtos.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// xem truoc chi dung gia tri mau, khong nhan bien tu client
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminEmailPreviewRequestDto {
    private String code;
    private String subject;
    private String body;
}
