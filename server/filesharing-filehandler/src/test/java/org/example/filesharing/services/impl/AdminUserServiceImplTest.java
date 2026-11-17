package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.PageRequestDto;
import com.file.service.filesharing.core.entity.PageResult;
import com.file.service.filesharing.core.entity.models.AuditLogEntity;
import com.file.service.filesharing.core.enums.AuditAction;
import com.file.service.filesharing.core.enums.AuditActorType;
import com.file.service.filesharing.core.enums.auth.AuthProvider;
import com.file.service.filesharing.core.enums.auth.UserGrantedRole;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.UserBusinessException;
import org.bson.Document;
import org.example.filesharing.controllers.AdminUserController;
import org.example.filesharing.entities.dtos.admin.*;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.repositories.AuditLogRepo;
import org.example.filesharing.repositories.UserRepo;
import org.example.filesharing.services.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminUserServiceImplTest {

    @Mock UserRepo userRepo;
    @Mock MongoTemplate mongoTemplate;
    @Mock AuditService auditService;
    @Mock AuditLogRepo auditLogRepo;
    PasswordEncoder encoder = new BCryptPasswordEncoder();
    AdminUserServiceImpl service;
    UserEntity actor;

    @BeforeEach
    void setUp() {
        service = new AdminUserServiceImpl(userRepo, mongoTemplate, encoder, auditService, auditLogRepo);
        actor = user("sa1", "sa1@test.com", true, UserGrantedRole.ROLE_USER, UserGrantedRole.ROLE_SA);
        when(auditService.getCurrentUser()).thenReturn(actor);
        when(auditService.getCurrentUserId()).thenReturn("sa1");
        when(userRepo.save(any(UserEntity.class))).thenAnswer(i -> i.getArgument(0));
    }

    private UserEntity user(String id, String email, boolean enabled, UserGrantedRole... roles) {
        return UserEntity.builder().userId(id).email(email).publicUserName(id).enabled(enabled)
                .userGrantedRoles(new ArrayList<>(List.of(roles))).password("secret-hash-x").build();
    }

    private ErrorCode codeOf(Runnable r) {
        return assertThrows(UserBusinessException.class, r::run).getErrorCode();
    }

    @Test
    void getPaged_locBoLocVaPhanTrang() {
        when(mongoTemplate.count(any(Query.class), eq(UserEntity.class))).thenReturn(25L);
        when(mongoTemplate.find(any(Query.class), eq(UserEntity.class)))
                .thenReturn(List.of(user("u1", "a@test.com", true, UserGrantedRole.ROLE_USER)));
        AdminUserFilterDto f = new AdminUserFilterDto("a.b", UserGrantedRole.ROLE_SA, true, AuthProvider.LOCAL);
        PageRequestDto<AdminUserFilterDto> req = new PageRequestDto<>(10, 10, "password asc", f);

        PageResult<AdminUserRowDto> res = service.getPaged(req);

        assertEquals(25L, res.getTotalCount());
        assertEquals(1, res.getData().size());
        assertTrue(res.getData().get(0).getRoles().contains(UserGrantedRole.ROLE_USER));
        ArgumentCaptor<Query> q = ArgumentCaptor.forClass(Query.class);
        verify(mongoTemplate).find(q.capture(), eq(UserEntity.class));
        Document qo = q.getValue().getQueryObject();
        assertEquals(UserGrantedRole.ROLE_SA, qo.get("userGrantedRoles"));
        assertEquals(true, qo.get("enabled"));
        assertEquals(AuthProvider.LOCAL, qo.get("providers.provider"));
        assertTrue(qo.containsKey("$or"));
        assertEquals(10L, q.getValue().getSkip());
        assertEquals(10, q.getValue().getLimit());
        // sort theo cot cam (password) bi bo, rơi ve createdAt
        assertFalse(q.getValue().getSortObject().containsKey("password"));
        assertTrue(q.getValue().getSortObject().containsKey("createdAt"));
    }

    @Test
    void getDetail_demSoLieu() {
        when(userRepo.findById("u1")).thenReturn(Optional.of(user("u1", "a@test.com", true, UserGrantedRole.ROLE_USER)));
        when(mongoTemplate.count(any(Query.class), eq(com.file.service.filesharing.core.entity.models.ProjectEntity.class))).thenReturn(3L);
        when(mongoTemplate.aggregate(any(Aggregation.class),
                eq(com.file.service.filesharing.core.entity.models.MetadataEntity.class), eq(Document.class)))
                .thenReturn(new AggregationResults<>(List.of(new Document("fileCount", 7).append("storageBytes", 123L)), new Document()));
        AdminUserDetailDto d = service.getDetail("u1");
        assertEquals(3L, d.getOwnedProjectCount());
        assertEquals(7L, d.getFileCount());
        assertEquals(123L, d.getStorageBytes());
    }

    @Test
    void tuKhoaMinh_biChan() {
        when(userRepo.findById("sa1")).thenReturn(Optional.of(actor));
        assertEquals(ErrorCode.ADMIN_SELF_ACTION_FORBIDDEN, codeOf(() -> service.lock("sa1")));
        verify(userRepo, never()).save(any());
    }

    @Test
    void tuGoSa_biChan() {
        when(userRepo.findById("sa1")).thenReturn(Optional.of(actor));
        assertEquals(ErrorCode.ADMIN_SELF_ACTION_FORBIDDEN,
                codeOf(() -> service.updateRoles("sa1", new AdminRoleUpdateDto(List.of(UserGrantedRole.ROLE_USER)))));
    }

    @Test
    void khoaSaCuoi_409() {
        UserEntity other = user("sa2", "sa2@test.com", true, UserGrantedRole.ROLE_USER, UserGrantedRole.ROLE_SA);
        when(userRepo.findById("sa2")).thenReturn(Optional.of(other));
        when(userRepo.countByUserGrantedRolesContainingAndEnabled(UserGrantedRole.ROLE_SA, true)).thenReturn(1L);
        assertEquals(ErrorCode.ADMIN_LAST_SA, codeOf(() -> service.lock("sa2")));
        assertEquals(ErrorCode.ADMIN_LAST_SA,
                codeOf(() -> service.updateRoles("sa2", new AdminRoleUpdateDto(List.of()))));
        verify(userRepo, never()).save(any());
    }

    @Test
    void khoaSaKhiConSaKhac_duocVaGhiAudit() {
        UserEntity other = user("sa2", "sa2@test.com", true, UserGrantedRole.ROLE_USER, UserGrantedRole.ROLE_SA);
        when(userRepo.findById("sa2")).thenReturn(Optional.of(other));
        when(userRepo.countByUserGrantedRolesContainingAndEnabled(UserGrantedRole.ROLE_SA, true)).thenReturn(2L);
        assertFalse(service.lock("sa2").isEnabled());
        ArgumentCaptor<AuditLogEntity> a = ArgumentCaptor.forClass(AuditLogEntity.class);
        verify(auditLogRepo).save(a.capture());
        assertEquals(AuditActorType.ADMIN, a.getValue().getActorType());
        assertEquals(AuditAction.USER_LOCKED, a.getValue().getAction());
        assertNull(a.getValue().getProjectId());
        assertEquals("sa2@test.com", a.getValue().getTargetName());
    }

    @Test
    void updateRoles_luonCoRoleUser() {
        UserEntity u = user("u1", "u1@test.com", true, UserGrantedRole.ROLE_USER);
        when(userRepo.findById("u1")).thenReturn(Optional.of(u));
        AdminUserRowDto r = service.updateRoles("u1", new AdminRoleUpdateDto(List.of(UserGrantedRole.ROLE_SA)));
        assertTrue(r.getRoles().contains(UserGrantedRole.ROLE_USER));
        assertTrue(r.getRoles().contains(UserGrantedRole.ROLE_SA));
    }

    @Test
    void revokeSessions_catGiay() {
        UserEntity u = user("u1", "u1@test.com", true, UserGrantedRole.ROLE_USER);
        when(userRepo.findById("u1")).thenReturn(Optional.of(u));
        service.revokeSessions("u1");
        assertNotNull(u.getSessionsValidAfter());
        assertEquals(0, u.getSessionsValidAfter().getNano());
    }

    @Test
    void taoTaiKhoanVanHanh_thanhCongHashBcryptVaAuditKhongChuaMatKhau() {
        String pw = "fake-Password-1";
        AdminUserRowDto r = service.createOperatorAccount(new AdminCreateUserRequestDto("new@test.com", "Van hanh", pw));
        assertTrue(r.getRoles().containsAll(List.of(UserGrantedRole.ROLE_USER, UserGrantedRole.ROLE_SA)));
        assertTrue(r.isEnabled());
        ArgumentCaptor<UserEntity> saved = ArgumentCaptor.forClass(UserEntity.class);
        verify(userRepo).save(saved.capture());
        assertTrue(saved.getValue().getPassword().startsWith("$2"));
        assertTrue(encoder.matches(pw, saved.getValue().getPassword()));
        ArgumentCaptor<AuditLogEntity> a = ArgumentCaptor.forClass(AuditLogEntity.class);
        verify(auditLogRepo).save(a.capture());
        assertEquals(AuditAction.USER_CREATED, a.getValue().getAction());
        assertEquals(AuditActorType.ADMIN, a.getValue().getActorType());
        assertNull(a.getValue().getProjectId());
        assertFalse(a.getValue().toString().contains(pw));
        assertFalse(a.getValue().toString().contains(saved.getValue().getPassword()));
    }

    @Test
    void taoTaiKhoan_trungEmail() {
        when(userRepo.existsByEmail("dup@test.com")).thenReturn(true);
        assertEquals(ErrorCode.USER_ALREADY_EXISTS,
                codeOf(() -> service.createOperatorAccount(new AdminCreateUserRequestDto("dup@test.com", "x", "fake-Password-1"))));
        when(userRepo.existsByEmail("race@test.com")).thenReturn(false);
        when(userRepo.save(any(UserEntity.class))).thenThrow(new DuplicateKeyException("dup"));
        assertEquals(ErrorCode.USER_ALREADY_EXISTS,
                codeOf(() -> service.createOperatorAccount(new AdminCreateUserRequestDto("race@test.com", "x", "fake-Password-1"))));
    }

    @Test
    void dtoKhongCoFieldCam() {
        Set<String> banned = Set.of("providerId", "password", "passwordHash", "metadata", "providers_info");
        for (Class<?> c : List.of(AdminUserRowDto.class, AdminUserDetailDto.class)) {
            for (var f : c.getDeclaredFields()) {
                assertFalse(banned.contains(f.getName()), c.getSimpleName() + "." + f.getName());
            }
        }
    }

    @Test
    void khongCoRouteDeleteUser() {
        for (Method m : AdminUserController.class.getDeclaredMethods()) {
            assertNull(m.getAnnotation(DeleteMapping.class), m.getName());
            RequestMapping rm = m.getAnnotation(RequestMapping.class);
            assertTrue(rm == null || !Arrays.asList(rm.method()).toString().contains("DELETE"));
            assertFalse(Modifier.isPublic(m.getModifiers()) && m.getName().toLowerCase().contains("delete"));
        }
    }
}
