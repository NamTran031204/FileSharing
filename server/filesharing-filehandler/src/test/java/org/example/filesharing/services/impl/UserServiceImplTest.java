package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.enums.auth.UserGrantedRole;
import org.example.filesharing.entities.dtos.user.UserDto;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.repositories.AdminRoleRepo;
import org.example.filesharing.repositories.UserRepo;
import org.example.filesharing.services.AdminPermission;
import org.example.filesharing.services.AdminPermissionResolver;
import org.example.filesharing.services.AuditService;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

// AC-2 / AC-6c (BE): permissions va adminSide cua GET /api/users (self)
class UserServiceImplTest {

    private UserServiceImpl svc(UserRepo repo, AuditService audit) {
        return new UserServiceImpl(repo, null, null, null, audit,
                new AdminPermissionResolver(mock(AdminRoleRepo.class)));
    }

    private UserDto getSelf(UserGrantedRole... roles) {
        UserRepo repo = mock(UserRepo.class);
        AuditService audit = mock(AuditService.class);
        UserEntity u = UserEntity.builder().userId("me").email("me@test.com")
                .userGrantedRoles(new ArrayList<>(List.of(roles))).build();
        when(repo.findById("me")).thenReturn(Optional.of(u));
        when(audit.getCurrentUserId()).thenReturn("me");
        return svc(repo, audit).getUserById("");
    }

    @Test
    void userVaSa_permissionsRong_khongAdminSide() {
        UserDto d = getSelf(UserGrantedRole.ROLE_USER, UserGrantedRole.ROLE_SA);
        assertTrue(d.getPermissions().isEmpty());
        assertFalse(d.getAdminSide());
    }

    @Test
    void saThuan_fullCatalogue_adminSide() {
        UserDto d = getSelf(UserGrantedRole.ROLE_SA);
        assertEquals(AdminPermission.allNames().size(), d.getPermissions().size());
        assertTrue(d.getAdminSide());
    }

    @Test
    void nguoiKhac_khongLoQuyen() {
        UserRepo repo = mock(UserRepo.class);
        AuditService audit = mock(AuditService.class);
        when(repo.findById("other")).thenReturn(Optional.of(UserEntity.builder().userId("other")
                .userGrantedRoles(new ArrayList<>(List.of(UserGrantedRole.ROLE_SA))).build()));
        when(audit.getCurrentUserId()).thenReturn("me");
        UserDto d = svc(repo, audit).getUserById("other");
        assertNull(d.getPermissions());
        assertNull(d.getAdminSide());
    }
}
