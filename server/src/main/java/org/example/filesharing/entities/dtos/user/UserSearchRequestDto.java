package org.example.filesharing.entities.dtos.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserSearchRequestDto {
    /**
     * Search string for searching by username or email
     */
    private String searchText;
}
