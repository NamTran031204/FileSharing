package org.example.filesharing.entities.dtos.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// mode: CONNECT (chi kiem ket noi SMTP) | SEND (gui thu); toEmail bo trong thi gui cho chinh SA
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminMailTestRequestDto {
    private String mode;
    private String toEmail;
}
