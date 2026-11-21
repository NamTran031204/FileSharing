package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.AuditLogEntity;
import com.file.service.filesharing.core.enums.AuditAction;
import com.file.service.filesharing.core.enums.AuditActorType;
import com.file.service.filesharing.core.enums.auth.UserGrantedRole;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.UserBusinessException;
import org.example.filesharing.entities.dtos.admin.AdminRoleDetailDto;
import org.example.filesharing.entities.dtos.admin.AdminRoleUpsertDto;
import org.example.filesharing.entities.models.AdminRoleEntity;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.repositories.AdminRoleRepo;
import org.example.filesharing.repositories.AuditLogRepo;
import org.example.filesharing.repositories.UserRepo;
import org.example.filesharing.services.AdminPermissionResolver;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminRoleServiceImplTest {

    static final String ROLE_UPDATE = "Admin.Role.Update";
    static final String SETTING_UPDATE = "Admin.Setting.Update";
    static final String NODE_DRAIN = "Admin.Node.Drain";

    @Mock AdminRoleRepo adminRoleRepo;
    @Mock UserRepo userRepo;
    @Mock MongoTemplate mongoTemplate;
    @Mock AdminPermissionResolver resolver;
    @Mock AuditService auditService;
    @Mock AuditLogRepo auditLogRepo;
    AdminRoleServiceImpl service;
    UserEntity actor;

    @BeforeEach
    void setUp() {
        service = new AdminRoleServiceImpl(adminRoleRepo, userRepo, mongoTemplate, resolver, auditService, auditLogRepo);
        actor = UserEntity.builder().userId("a1").email("a1@test.com")
                .userGrantedRoles(new ArrayList<>(List.of(UserGrantedRole.ROLE_SA))).build();
        when(auditService.getCurrentUser()).thenReturn(actor);
        // mac dinh actor co Role.Update va Node.Drain, khong co Setting.Update
        when(resolver.effective(actor)).thenReturn(Set.of(ROLE_UPDATE, NODE_DRAIN));
        when(adminRoleRepo.save(any(AdminRoleEntity.class))).thenAnswer(i -> i.getArgument(0));
    }

    private AdminRoleUpsertDto dto(String code, String... perms) {
        return new AdminRoleUpsertDto(code, "name", "desc", List.of(perms));
    }

    private AdminRoleEntity role(String id, String... perms) {
        return AdminRoleEntity.builder().id(id).code("r-" + id).permissions(new ArrayList<>(List.of(perms))).build();
    }

    private ErrorCode codeOf(Runnable r) {
        return assertThrows(UserBusinessException.class, r::run).getErrorCode();
    }

    private AuditLogEntity lastAudit() {
        ArgumentCaptor<AuditLogEntity> c = ArgumentCaptor.forClass(AuditLogEntity.class);
        verify(auditLogRepo).save(c.capture());
        return c.getValue();
    }

    @Test
    void update_themQuyenActorKhongCo_escalation() {
        when(adminRoleRepo.findById("1")).thenReturn(Optional.of(role("1", NODE_DRAIN)));
        assertEquals(ErrorCode.ADMIN_PERMISSION_ESCALATION,
                codeOf(() -> service.update("1", dto("x", NODE_DRAIN, SETTING_UPDATE))));
        verify(adminRoleRepo, never()).save(any());
        verify(auditLogRepo, never()).save(any());
    }

    @Test
    void update_boQuyenActorKhongCo_escalation() {
        when(adminRoleRepo.findById("1")).thenReturn(Optional.of(role("1", NODE_DRAIN, SETTING_UPDATE)));
        assertEquals(ErrorCode.ADMIN_PERMISSION_ESCALATION,
                codeOf(() -> service.update("1", dto("x", NODE_DRAIN))));
        verify(adminRoleRepo, never()).save(any());
    }

    @Test
    void update_giuNguyenQuyenActorKhongCo_duocPhep_vaGhiAudit() {
        when(adminRoleRepo.findById("1")).thenReturn(Optional.of(role("1", NODE_DRAIN, SETTING_UPDATE)));
        // them Role.Update (actor co), giu Setting.Update (khong co) nguyen
        AdminRoleDetailDto res = service.update("1", dto("ignored", SETTING_UPDATE, NODE_DRAIN, ROLE_UPDATE, ROLE_UPDATE));
        assertEquals(List.of(NODE_DRAIN, ROLE_UPDATE, SETTING_UPDATE), res.getPermissions());
        assertEquals("r-1", res.getCode());
        AuditLogEntity a = lastAudit();
        assertEquals(AuditAction.ADMIN_ROLE_UPDATED, a.getAction());
        assertEquals(AuditActorType.ADMIN, a.getActorType());
        assertNull(a.getProjectId());
    }

    @Test
    void delete_conUser_inUse() {
        when(adminRoleRepo.findById("1")).thenReturn(Optional.of(role("1")));
        when(userRepo.countByAdminRoleIdsContaining("1")).thenReturn(2L);
        assertEquals(ErrorCode.ADMIN_ROLE_IN_USE, codeOf(() -> service.delete("1")));
        verify(adminRoleRepo, never()).deleteById(any());
        verify(auditLogRepo, never()).save(any());
    }

    @Test
    void delete_hetUser_xoaVaGhiAudit() {
        when(adminRoleRepo.findById("1")).thenReturn(Optional.of(role("1", NODE_DRAIN)));
        when(userRepo.countByAdminRoleIdsContaining("1")).thenReturn(0L);
        service.delete("1");
        verify(adminRoleRepo).deleteById("1");
        assertEquals(AuditAction.ADMIN_ROLE_DELETED, lastAudit().getAction());
    }

    @Test
    void create_ghiAuditVaChuanHoaQuyen() {
        AdminRoleDetailDto res = service.create(dto("ops", ROLE_UPDATE, NODE_DRAIN, NODE_DRAIN));
        assertEquals(List.of(NODE_DRAIN, ROLE_UPDATE), res.getPermissions());
        AuditLogEntity a = lastAudit();
        assertEquals(AuditAction.ADMIN_ROLE_CREATED, a.getAction());
        assertEquals(AuditActorType.ADMIN, a.getActorType());
    }

    @Test
    void create_themQuyenActorKhongCo_escalation() {
        assertEquals(ErrorCode.ADMIN_PERMISSION_ESCALATION, codeOf(() -> service.create(dto("ops", SETTING_UPDATE))));
        verify(adminRoleRepo, never()).save(any());
    }

    @Test
    void create_trungCode() {
        when(adminRoleRepo.existsByCode("ops")).thenReturn(true);
        assertEquals(ErrorCode.ADMIN_ROLE_CODE_DUPLICATE, codeOf(() -> service.create(dto("ops"))));
        // race: unique index nem DuplicateKeyException
        when(adminRoleRepo.existsByCode("ops2")).thenReturn(false);
        when(adminRoleRepo.save(any(AdminRoleEntity.class))).thenThrow(new DuplicateKeyException("dup"));
        assertEquals(ErrorCode.ADMIN_ROLE_CODE_DUPLICATE, codeOf(() -> service.create(dto("ops2"))));
    }

    @Test
    void create_quyenLa_unknown() {
        assertEquals(ErrorCode.ADMIN_PERMISSION_UNKNOWN, codeOf(() -> service.create(dto("ops", "Admin.Foo.Bar"))));
    }

    @Test
    void getDetail_khongTonTai_notFound() {
        when(adminRoleRepo.findById("zz")).thenReturn(Optional.empty());
        assertEquals(ErrorCode.ADMIN_ROLE_NOT_FOUND, codeOf(() -> service.getDetail("zz")));
    }

    @Test
    void permissionCatalogue_nhomTheoGroupVaResource() {
        var groups = service.permissionCatalogue();
        assertEquals(20, groups.stream().flatMap(g -> g.getResources().stream())
                .mapToInt(r -> r.getPermissions().size()).sum());
    }
}
