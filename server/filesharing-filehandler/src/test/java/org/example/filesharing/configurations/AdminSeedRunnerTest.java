package org.example.filesharing.configurations;

import com.file.service.filesharing.core.enums.auth.UserGrantedRole;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.repositories.UserRepo;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AdminSeedRunnerTest {

    // hash gia, khong phai hash cua mat khau that
    private static final String FAKE_HASH = "$2a$10$fakefakefakefakefakefuABCDEFGHIJKLMNOPQRSTUVWXYZ01234";

    private AdminSeedRunner runner(UserRepo repo, String hash) {
        AdminSeedRunner r = new AdminSeedRunner(repo);
        ReflectionTestUtils.setField(r, "email", "seed@test.com");
        ReflectionTestUtils.setField(r, "publicUserName", "Admin");
        ReflectionTestUtils.setField(r, "passwordHash", hash);
        return r;
    }

    @Test
    void chuaCo_taoUserSa() {
        UserRepo repo = mock(UserRepo.class);
        when(repo.existsByEmail("seed@test.com")).thenReturn(false);
        runner(repo, FAKE_HASH).run(null);
        ArgumentCaptor<UserEntity> c = ArgumentCaptor.forClass(UserEntity.class);
        verify(repo).save(c.capture());
        UserEntity u = c.getValue();
        assertEquals(FAKE_HASH, u.getPassword());
        assertTrue(u.isEnabled());
        assertTrue(u.isEmailVerified());
        assertTrue(u.getUserGrantedRoles().containsAll(java.util.List.of(UserGrantedRole.ROLE_USER, UserGrantedRole.ROLE_SA)));
    }

    @Test
    void daCo_khongDoi() {
        UserRepo repo = mock(UserRepo.class);
        when(repo.existsByEmail("seed@test.com")).thenReturn(true);
        runner(repo, FAKE_HASH).run(null);
        verify(repo, never()).save(any());
    }

    @Test
    void hashRong_boQua() {
        UserRepo repo = mock(UserRepo.class);
        runner(repo, "").run(null);
        verifyNoInteractions(repo);
    }

    @Test
    void chayDongThoi_duplicateKeyKhongNem() {
        UserRepo repo = mock(UserRepo.class);
        when(repo.existsByEmail("seed@test.com")).thenReturn(false);
        when(repo.save(any(UserEntity.class))).thenThrow(new DuplicateKeyException("dup"));
        assertDoesNotThrow(() -> runner(repo, FAKE_HASH).run(null));
    }
}
