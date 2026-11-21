package org.example.filesharing.entities.dtos.admin;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

// gan quyen quan tri cho tai khoan phia quan tri: co ROLE_SA hay khong va danh sach nhom quyen
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminAssignRolesDto {
    private boolean sa;

    @NotNull
    private List<String> adminRoleIds;
}
