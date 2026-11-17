package org.example.filesharing.entities.dtos.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// error ngan, khong bao gio chua credential hay noi dung exception cua SMTP
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMailTestResultDto {
    private boolean ok;
    private long latencyMs;
    private String error;
}
