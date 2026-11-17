package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.AuditLogEntity;
import com.file.service.filesharing.core.entity.models.SystemSettingEntity;
import com.file.service.filesharing.core.enums.AuditAction;
import com.file.service.filesharing.core.enums.AuditActorType;
import com.file.service.filesharing.core.enums.AuditTargetType;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import com.file.service.filesharing.core.setting.RuntimeSettings;
import com.file.service.filesharing.core.setting.SettingCipher;
import com.file.service.filesharing.core.setting.SettingGroup;
import com.file.service.filesharing.core.setting.SettingKey;
import org.example.filesharing.entities.dtos.admin.AdminSettingGroupDto;
import org.example.filesharing.entities.dtos.admin.AdminSettingItemDto;
import org.example.filesharing.entities.dtos.admin.AdminSettingUpdateRequestDto;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.repositories.AuditLogRepo;
import org.example.filesharing.services.AuditService;
import org.jasypt.encryption.StringEncryptor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.mock.env.MockEnvironment;

import java.time.Duration;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith({MockitoExtension.class, OutputCaptureExtension.class})
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminSettingServiceImplTest {

    static final String ORIGIN = "http://localhost:5173";

    @Mock MongoTemplate mongo;
    @Mock AuditService auditService;
    @Mock AuditLogRepo auditLogRepo;

    // kho gia lap cua collection system_settings
    Map<String, SystemSettingEntity> db = new HashMap<>();
    boolean cipherBroken;
    RuntimeSettings settings;
    AdminSettingServiceImpl service;

    @BeforeEach
    void setUp() {
        StringEncryptor enc = new StringEncryptor() {
            @Override
            public String encrypt(String m) {
                if (cipherBroken) throw new IllegalStateException("khoa sai, plaintext=" + m);
                return "c(" + m + ")";
            }

            @Override
            public String decrypt(String m) {
                if (cipherBroken) throw new IllegalStateException("khoa sai, cipher=" + m);
                return m.substring(2, m.length() - 1);
            }
        };
        SettingCipher cipher = new SettingCipher(enc);
        when(mongo.findAll(SystemSettingEntity.class)).thenAnswer(i -> new ArrayList<>(db.values()));
        when(mongo.save(any(SystemSettingEntity.class))).thenAnswer(i -> {
            SystemSettingEntity e = i.getArgument(0);
            db.put(e.getKey(), e);
            return e;
        });
        when(mongo.remove(any(Query.class), eq(SystemSettingEntity.class))).thenAnswer(i -> {
            Query q = i.getArgument(0);
            db.remove(q.getQueryObject().get("_id"));
            return null;
        });
        settings = new RuntimeSettings(mongo, cipher, new MockEnvironment(), Duration.ofSeconds(10));
        settings.refresh();
        UserEntity actor = UserEntity.builder().userId("sa1").email("sa1@test.com").build();
        when(auditService.getCurrentUser()).thenReturn(actor);
        service = new AdminSettingServiceImpl(mongo, settings, cipher, auditService, auditLogRepo);
    }

    private AdminSettingUpdateRequestDto req(Map<String, String> values, String... clear) {
        return new AdminSettingUpdateRequestDto(values, List.of(clear));
    }

    private ErrorCode codeOf(Runnable r) {
        return assertThrows(FileBusinessException.class, r::run).getErrorCode();
    }

    @Test
    void doiGiaTri_luuOverrideVaAudit() {
        service.updateGroup("MAIL", req(Map.of("mail.port", "2525")), ORIGIN);
        assertEquals("2525", db.get("mail.port").getValue());
        assertEquals(2525, settings.intValue(SettingKey.MAIL_PORT));

        ArgumentCaptor<AuditLogEntity> cap = ArgumentCaptor.forClass(AuditLogEntity.class);
        verify(auditLogRepo).save(cap.capture());
        AuditLogEntity a = cap.getValue();
        assertEquals(AuditAction.SETTING_UPDATED, a.getAction());
        assertEquals(AuditActorType.ADMIN, a.getActorType());
        assertEquals(AuditTargetType.SETTING, a.getTargetType());
        assertNull(a.getProjectId());
        // key map trong Mongo khong duoc chua dau cham, neu khong luu audit se loi 500
        assertTrue(a.getChanges().getBefore().keySet().stream().noneMatch(k -> k.contains(".")));
        assertTrue(a.getChanges().getAfter().keySet().stream().noneMatch(k -> k.contains(".")));
    }

    @Test
    void giaTriBangMacDinh_xoaOverride() {
        service.updateGroup("MAIL", req(Map.of("mail.port", "2525")), ORIGIN);
        service.updateGroup("MAIL", req(Map.of("mail.port", "587")), ORIGIN);
        assertFalse(db.containsKey("mail.port"));
        assertFalse(settings.isOverridden(SettingKey.MAIL_PORT));
    }

    @Test
    void secret_luuFsenc1_getKhongPlaintext_vaAuditKhongChua() {
        service.updateGroup("MAIL", req(Map.of("mail.password", "p4ss-w0rd")), ORIGIN);
        String stored = db.get("mail.password").getValue();
        assertTrue(stored.startsWith("FSENC1:"));
        assertFalse(stored.contains("p4ss-w0rd") && !stored.startsWith("FSENC1:"));

        AdminSettingItemDto item = service.getAll().stream().filter(g -> g.getGroup().equals("MAIL"))
                .flatMap(g -> g.getItems().stream()).filter(i -> i.getKey().equals("mail.password")).findFirst().orElseThrow();
        assertTrue(item.isMaskedSet());
        assertNull(item.getValue());
        assertNull(item.getDefaultValue());
        String all = service.getAll().toString();
        assertFalse(all.contains("p4ss-w0rd"));
        assertFalse(all.contains("FSENC1"));

        ArgumentCaptor<AuditLogEntity> cap = ArgumentCaptor.forClass(AuditLogEntity.class);
        verify(auditLogRepo).save(cap.capture());
        assertFalse(cap.getValue().getChanges().toString().contains("p4ss-w0rd"));
        assertFalse(cap.getValue().getChanges().toString().contains("FSENC1"));
    }

    @Test
    void secretTrong_giuNguyen_clear_xoa() {
        service.updateGroup("MAIL", req(Map.of("mail.password", "p4ss")), ORIGIN);
        String stored = db.get("mail.password").getValue();

        service.updateGroup("MAIL", req(Map.of("mail.password", "", "mail.host", "smtp.x.com")), ORIGIN);
        assertEquals(stored, db.get("mail.password").getValue());

        service.updateGroup("MAIL", req(Map.of(), "mail.password"), ORIGIN);
        assertFalse(db.containsKey("mail.password"));
    }

    @Test
    void keyLa_vaKeyKhacNhom_unknownKey() {
        assertEquals(ErrorCode.SETTING_UNKNOWN_KEY, codeOf(() ->
                service.updateGroup("MAIL", req(Map.of("khong.ton.tai", "1")), ORIGIN)));
        assertEquals(ErrorCode.SETTING_UNKNOWN_KEY, codeOf(() ->
                service.updateGroup("MAIL", req(Map.of("upload.max-file-size", "x")), ORIGIN)));
        assertEquals(ErrorCode.SETTING_UNKNOWN_KEY, codeOf(() ->
                service.updateGroup("NOPE", req(Map.of()), ORIGIN)));
        assertEquals(ErrorCode.SETTING_UNKNOWN_KEY, codeOf(() -> service.reset("khong.ton.tai", ORIGIN)));
        assertTrue(db.isEmpty());
    }

    @Test
    void saiKieuMinMax_invalidValueKemKey() {
        for (String v : new String[]{"abc", "-1", "70000"}) {
            FileBusinessException e = assertThrows(FileBusinessException.class, () ->
                    service.updateGroup("MAIL", req(Map.of("mail.port", v)), ORIGIN));
            assertEquals(ErrorCode.SETTING_INVALID_VALUE, e.getErrorCode());
            assertTrue(e.getMessage().contains("mail.port"));
        }
        assertTrue(db.isEmpty());
    }

    @Test
    void reset_xoaOverrideVaAuditReset() {
        service.updateGroup("MAIL", req(Map.of("mail.port", "2525")), ORIGIN);
        AdminSettingItemDto item = service.reset("mail.port", ORIGIN);
        assertFalse(item.isOverridden());
        assertEquals("587", item.getValue());
        ArgumentCaptor<AuditLogEntity> cap = ArgumentCaptor.forClass(AuditLogEntity.class);
        verify(auditLogRepo, times(2)).save(cap.capture());
        assertEquals(AuditAction.SETTING_RESET, cap.getAllValues().get(1).getAction());
    }

    @Test
    void nhomKhoa_ghiVaResetBiTuChoi_khongGhiDbKhongAudit() {
        for (SettingGroup g : SettingGroup.values()) {
            if (!g.isFixed()) continue;
            assertEquals(ErrorCode.SETTING_READ_ONLY, codeOf(() ->
                    service.updateGroup(g.name(), req(Map.of("upload.max-file-size", "1B")), ORIGIN)), g.name());
        }
        for (SettingKey k : SettingKey.values()) {
            if (!k.group().isFixed()) continue;
            assertEquals(ErrorCode.SETTING_READ_ONLY, codeOf(() -> service.reset(k.key(), ORIGIN)), k.key());
        }
        assertTrue(db.isEmpty());
        verify(mongo, never()).save(any(SystemSettingEntity.class));
        verify(mongo, never()).remove(any(Query.class), eq(SystemSettingEntity.class));
        verify(auditLogRepo, never()).save(any());
    }

    @Test
    void getAll_nhomKhoaReadOnly_giaTriTuRecord_boQuaMongo() {
        db.put("upload.max-file-size", SystemSettingEntity.builder().key("upload.max-file-size").value("1B").build());
        settings.refresh();
        for (AdminSettingGroupDto g : service.getAll()) {
            assertEquals(SettingGroup.valueOf(g.getGroup()).isFixed(), g.isReadOnly(), g.getGroup());
            if (!g.isReadOnly()) continue;
            for (AdminSettingItemDto i : g.getItems()) {
                assertFalse(i.isOverridden(), i.getKey());
                if (i.getKey().equals("upload.max-file-size")) assertEquals("50GB", i.getValue());
            }
        }
    }

    @Test
    void cipherLoi_cipherFailed_khongLoPlaintextHayCause(CapturedOutput out) {
        cipherBroken = true;
        FileBusinessException e = assertThrows(FileBusinessException.class, () ->
                service.updateGroup("MAIL", req(Map.of("mail.password", "p4ss-w0rd")), ORIGIN));
        assertEquals(ErrorCode.SETTING_CIPHER_FAILED, e.getErrorCode());
        assertNull(e.getCause());
        assertFalse(String.valueOf(e.getMessage()).contains("p4ss-w0rd"));
        assertFalse(out.getAll().contains("p4ss-w0rd"));
        assertTrue(db.isEmpty());
    }

    @Test
    void cipherLoiKhiGiaiMa_khongLoCipher(CapturedOutput out) {
        db.put("mail.password", SystemSettingEntity.builder().key("mail.password").value("FSENC1:c(abc)").build());
        settings.refresh();
        cipherBroken = true;
        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> settings.secret(SettingKey.MAIL_PASSWORD));
        assertEquals(ErrorCode.SETTING_CIPHER_FAILED, e.getErrorCode());
        assertNull(e.getCause());
        assertFalse(out.getAll().contains("c(abc)"));
        // GET van chay duoc, khong can giai ma
        List<AdminSettingGroupDto> all = service.getAll();
        assertFalse(all.isEmpty());
    }
}
