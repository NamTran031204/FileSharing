package org.example.filesharing.services;

import com.file.service.filesharing.core.enums.auth.UserGrantedRole;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.models.AdminRoleEntity;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.repositories.AdminRoleRepo;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Noi duy nhat tinh quyen quan tri hieu luc (TK 3.4). Khong cache: moi lan goi doc lai DB nen
 * thay doi nhom quyen co hieu luc o request ke tiep.
 */
@Component
@RequiredArgsConstructor
public class AdminPermissionResolver {

    private final AdminRoleRepo adminRoleRepo;

    // phia quan tri = khong co ROLE_USER (khop cong SecurityConfig); roles null coi la phia quan tri nhung effective rong
    public static boolean isAdminSide(UserEntity user) {
        return user.getUserGrantedRoles() == null || !user.getUserGrantedRoles().contains(UserGrantedRole.ROLE_USER);
    }

    public Set<String> effective(UserEntity user) {
        if (user == null || user.getUserGrantedRoles() == null) return Set.of();
        List<UserGrantedRole> roles = user.getUserGrantedRoles();
        // fail-closed: ROLE_USER xet truoc ROLE_SA, tai khoan lo co ca hai nhan rong
        if (roles.contains(UserGrantedRole.ROLE_USER)) return Set.of();
        Set<String> catalogue = AdminPermission.allNames();
        if (roles.contains(UserGrantedRole.ROLE_SA)) return catalogue;
        List<String> roleIds = user.getAdminRoleIds();
        if (roleIds == null || roleIds.isEmpty()) return Set.of();
        Set<String> result = new HashSet<>();
        for (AdminRoleEntity r : adminRoleRepo.findAllById(roleIds)) {
            if (r.getPermissions() != null) result.addAll(r.getPermissions());
        }
        // chuoi ngoai catalogue (permission da bo) bi loai
        result.retainAll(catalogue);
        return result;
    }
}
