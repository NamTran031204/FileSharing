package org.example.filesharing.services;

import com.file.service.filesharing.core.enums.auth.UserGrantedRole;
import org.example.filesharing.entities.models.AdminRoleEntity;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.repositories.AdminRoleRepo;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminPermissionResolverTest {

    private final AdminRoleRepo repo = mock(AdminRoleRepo.class);
    private final AdminPermissionResolver resolver = new AdminPermissionResolver(repo);

    private UserEntity user(List<UserGrantedRole> roles, List<String> adminRoleIds) {
        return UserEntity.builder().userGrantedRoles(roles).adminRoleIds(adminRoleIds).build();
    }

    @Test
    void catalogue_khongTrungTen() {
        assertEquals(AdminPermission.values().length, AdminPermission.allNames().size());
    }

    @Test
    void userVaSa_failClosed_rong() {
        assertTrue(resolver.effective(user(List.of(UserGrantedRole.ROLE_USER, UserGrantedRole.ROLE_SA), List.of())).isEmpty());
        verifyNoInteractions(repo);
    }

    @Test
    void chiSa_toanCatalogue() {
        assertEquals(AdminPermission.allNames(),
                resolver.effective(user(List.of(UserGrantedRole.ROLE_SA), List.of())));
        verifyNoInteractions(repo);
    }

    @Test
    void vanHanh_hopQuyenCacNhomGiaoCatalogue_boChuoiLa() {
        when(repo.findAllById(List.of("r1", "r2"))).thenReturn(List.of(
                AdminRoleEntity.builder().id("r1").permissions(List.of("Admin.Node.GetPaged", "Admin.Legacy.Gone")).build(),
                AdminRoleEntity.builder().id("r2").permissions(List.of("Admin.Node.GetPaged", "Admin.Node.Drain")).build()));
        Set<String> eff = resolver.effective(user(List.of(), List.of("r1", "r2")));
        assertEquals(Set.of("Admin.Node.GetPaged", "Admin.Node.Drain"), eff);
    }

    @Test
    void rolesNull_rong() {
        assertTrue(resolver.effective(user(null, List.of("r1"))).isEmpty());
        assertTrue(resolver.effective(null).isEmpty());
        verifyNoInteractions(repo);
    }

    @Test
    void adminRoleIdsRongHoacNull_khongTruyVan() {
        assertTrue(resolver.effective(user(List.of(), List.of())).isEmpty());
        assertTrue(resolver.effective(user(List.of(), null)).isEmpty());
        verifyNoInteractions(repo);
    }

    @Test
    void roleKhongCoPermissions_nullSafe() {
        when(repo.findAllById(List.of("r1"))).thenReturn(List.of(AdminRoleEntity.builder().id("r1").permissions(null).build()));
        assertTrue(resolver.effective(user(List.of(), List.of("r1"))).isEmpty());
    }
}
