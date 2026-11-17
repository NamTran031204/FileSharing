package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.AuditLogEntity;
import com.file.service.filesharing.core.entity.models.SystemSettingEntity;
import com.file.service.filesharing.core.entity.models.auditlog.AuditChanges;
import com.file.service.filesharing.core.enums.AuditAction;
import com.file.service.filesharing.core.enums.AuditActorType;
import com.file.service.filesharing.core.enums.AuditTargetType;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import com.file.service.filesharing.core.setting.RuntimeSettings;
import com.file.service.filesharing.core.setting.SettingCipher;
import com.file.service.filesharing.core.setting.SettingGroup;
import com.file.service.filesharing.core.setting.SettingKey;
import com.file.service.filesharing.core.setting.SettingValidator;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.admin.AdminSettingGroupDto;
import org.example.filesharing.entities.dtos.admin.AdminSettingItemDto;
import org.example.filesharing.entities.dtos.admin.AdminSettingUpdateRequestDto;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.repositories.AuditLogRepo;
import org.example.filesharing.services.AdminSettingService;
import org.example.filesharing.services.AuditService;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminSettingServiceImpl implements AdminSettingService {

    private final MongoTemplate mongoTemplate;
    private final RuntimeSettings runtimeSettings;
    private final SettingCipher settingCipher;
    private final AuditService auditService;
    private final AuditLogRepo auditLogRepo;

    @Override
    public List<AdminSettingGroupDto> getAll() {
        Map<String, SystemSettingEntity> meta = loadMeta();
        List<AdminSettingGroupDto> out = new ArrayList<>();
        for (SettingGroup g : SettingGroup.values()) {
            out.add(AdminSettingGroupDto.builder().group(g.name()).readOnly(g.isFixed()).items(items(g, meta)).build());
        }
        return out;
    }

    @Override
    public List<AdminSettingItemDto> updateGroup(String group, AdminSettingUpdateRequestDto request, String requestOrigin) {
        SettingGroup g = parseGroup(group);
        requireWritable(g, g.name());
        Map<String, String> values = request == null || request.getValues() == null ? Map.of() : request.getValues();
        List<String> clear = request == null || request.getClear() == null ? List.of() : request.getClear();

        // gom thay doi truoc, loi thi chua ghi gi (value null = xoa override)
        Map<SettingKey, String> stored = new LinkedHashMap<>();
        Map<SettingKey, String> effective = new HashMap<>();
        for (String k : clear) {
            SettingKey key = keyInGroup(k, g);
            stored.put(key, null);
            if (!key.secret()) effective.put(key, key.defaultValue());
        }
        for (Map.Entry<String, String> e : values.entrySet()) {
            SettingKey key = keyInGroup(e.getKey(), g);
            if (key.secret()) {
                // de trong = giu nguyen; xoa chi qua clear
                if (e.getValue() == null || e.getValue().isBlank() || stored.containsKey(key)) continue;
                stored.put(key, settingCipher.encrypt(e.getValue()));
            } else {
                String v = SettingValidator.validate(key, e.getValue());
                stored.put(key, v.equals(key.defaultValue()) ? null : v);
                effective.put(key, v);
            }
        }
        checkCors(effective, requestOrigin);
        SettingValidator.validateCross(k -> k.secret() ? null : effective.getOrDefault(k, runtimeSettings.raw(k)));

        apply(stored, AuditAction.SETTING_UPDATED, g.name());
        return items(g, loadMeta());
    }

    @Override
    public AdminSettingItemDto reset(String key, String requestOrigin) {
        SettingKey k = SettingKey.of(key);
        if (k == null) throw unknown();
        requireWritable(k.group(), k.key());
        checkCors(Map.of(k, k.defaultValue()), requestOrigin);
        Map<SettingKey, String> stored = new LinkedHashMap<>();
        stored.put(k, null);
        apply(stored, AuditAction.SETTING_RESET, k.key());
        return toItem(k, loadMeta().get(k.key()));
    }

    // guard: danh sach origin moi phai chua Origin cua chinh request, neu khong SA tu khoa minh
    private void checkCors(Map<SettingKey, String> effective, String requestOrigin) {
        String list = effective.get(SettingKey.SECURITY_CORS_ALLOWED_ORIGINS);
        if (list == null) return;
        if (requestOrigin == null || !SettingValidator.splitList(list).contains(requestOrigin.trim())) {
            throw new FileBusinessException(ErrorCode.SETTING_INVALID_VALUE,
                    ErrorCode.SETTING_INVALID_VALUE.getMessage() + ": " + SettingKey.SECURITY_CORS_ALLOWED_ORIGINS.key());
        }
    }

    private void apply(Map<SettingKey, String> stored, AuditAction action, String targetId) {
        if (stored.isEmpty()) return;
        UserEntity actor = auditService.getCurrentUser();
        Map<String, Object> before = new LinkedHashMap<>();
        Map<String, Object> after = new LinkedHashMap<>();
        Instant now = Instant.now();
        for (Map.Entry<SettingKey, String> e : stored.entrySet()) {
            SettingKey k = e.getKey();
            // secret khong bao gio vao audit, chi ghi "changed"
            // key map trong Mongo khong duoc chua dau cham nen doi "." thanh "_" khi ghi audit
            String auditKey = k.key().replace('.', '_');
            before.put(auditKey, k.secret() ? "changed" : runtimeSettings.raw(k));
            after.put(auditKey, k.secret() ? "changed" : (e.getValue() == null ? k.defaultValue() : e.getValue()));
            if (e.getValue() == null) {
                mongoTemplate.remove(Query.query(Criteria.where("_id").is(k.key())), SystemSettingEntity.class);
            } else {
                mongoTemplate.save(SystemSettingEntity.builder().key(k.key()).value(e.getValue())
                        .updatedAt(now).updatedBy(actor.getUserId()).build());
            }
        }
        runtimeSettings.refresh();

        AuditLogEntity log = AuditLogEntity.builder()
                .actorId(actor.getUserId())
                .actorEmail(actor.getEmail())
                .actorType(AuditActorType.ADMIN)
                .action(action)
                .targetType(AuditTargetType.SETTING)
                .targetId(targetId)
                .targetName(targetId)
                .projectId(null)
                .changes(new AuditChanges(before, after))
                .timestamp(now)
                .build();
        log.setIsActive(true);
        log.setCreatedBy(actor.getUserId());
        log.setCreatedByEmail(actor.getEmail());
        auditLogRepo.save(log);
    }

    private List<AdminSettingItemDto> items(SettingGroup g, Map<String, SystemSettingEntity> meta) {
        return Arrays.stream(SettingKey.values()).filter(k -> k.group() == g)
                .map(k -> toItem(k, meta.get(k.key()))).toList();
    }

    private AdminSettingItemDto toItem(SettingKey k, SystemSettingEntity m) {
        // nhom khoa: isOverridden luon false nen khong lay metadata Mongo
        boolean overridden = runtimeSettings.isOverridden(k);
        return AdminSettingItemDto.builder()
                .key(k.key()).group(k.group().name()).type(k.type().name()).apply(k.apply().name())
                .secret(k.secret())
                .value(k.secret() ? null : runtimeSettings.raw(k))
                .maskedSet(k.secret() && (overridden || !runtimeSettings.raw(k).isBlank()))
                .defaultValue(k.secret() ? null : k.defaultValue())
                .overridden(overridden)
                .min(k.min()).max(k.max()).options(k.options())
                .updatedAt(overridden && m != null ? m.getUpdatedAt() : null)
                .updatedBy(overridden && m != null ? m.getUpdatedBy() : null)
                .build();
    }

    private Map<String, SystemSettingEntity> loadMeta() {
        return mongoTemplate.findAll(SystemSettingEntity.class).stream()
                .filter(e -> e.getKey() != null)
                .collect(Collectors.toMap(SystemSettingEntity::getKey, e -> e, (a, b) -> a));
    }

    private SettingGroup parseGroup(String group) {
        try {
            return SettingGroup.valueOf(group == null ? "" : group.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw unknown();
        }
    }

    private SettingKey keyInGroup(String key, SettingGroup g) {
        SettingKey k = key == null ? null : SettingKey.of(key);
        if (k == null || k.group() != g) throw unknown();
        return k;
    }

    // nhom khoa nam trong FixedSettings (core), admin chi doc; tu choi truoc moi thao tac ghi/audit
    private static void requireWritable(SettingGroup g, String target) {
        if (g.isFixed()) {
            throw new FileBusinessException(ErrorCode.SETTING_READ_ONLY,
                    ErrorCode.SETTING_READ_ONLY.getMessage() + ": " + target);
        }
    }

    private static FileBusinessException unknown() {
        return new FileBusinessException(ErrorCode.SETTING_UNKNOWN_KEY);
    }
}
