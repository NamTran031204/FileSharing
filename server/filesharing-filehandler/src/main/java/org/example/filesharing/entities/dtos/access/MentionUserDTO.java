package org.example.filesharing.entities.dtos.access;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Nguoi mention duoc, khong tra vai tro (Q7). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MentionUserDTO {
    private String userId;
    private String publicUserName;
    private String email;
}
