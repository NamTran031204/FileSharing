package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.PageRequestDto;
import com.file.service.filesharing.core.entity.PageResult;
import com.file.service.filesharing.core.entity.models.AuditLogEntity;
import com.file.service.filesharing.core.entity.models.auditlog.AuditChanges;
import com.file.service.filesharing.core.enums.AuditAction;
import com.file.service.filesharing.core.enums.AuditActorType;
import com.file.service.filesharing.core.enums.AuditTargetType;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.UserBusinessException;
import com.file.service.filesharing.core.utils.StringUtils;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.example.filesharing.entities.dtos.admin.*;
import org.example.filesharing.entities.models.AdminRoleEntity;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.repositories.AdminRoleRepo;
import org.example.filesharing.repositories.AuditLogRepo;
import org.example.filesharing.repositories.UserRepo;
import org.example.filesharing.services.AdminPermission;
import org.example.filesharing.services.AdminPermissionResolver;
import org.example.filesharing.services.AdminRoleService;
import org.example.filesharing.services.AuditService;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AdminRoleServiceImpl implements AdminRoleService {

    private static final Set<String> SORTABLE = Set.of("code", "name", "createdAt");

    private final AdminRoleRepo adminRoleRepo;
    private final UserRepo userRepo;
    private final MongoTemplate mongoTemplate;
    private final AdminPermissionResolver permissionResolver;
    private final AuditService auditService;
    private final AuditLogRepo auditLogRepo;

    @Override
    public PageResult<AdminRoleRowDto> getPaged(PageRequestDto<AdminRoleFilterDto> request) {
        Query query = new Query();
        AdminRoleFilterDto f = request.getFilter();
        if (f != null && !StringUtils.isNullOrBlank(f.getSearchText())) {
            String regex = Pattern.quote(f.getSearchText().trim());
            query.addCriteria(new Criteria().orOperator(
                    Criteria.where("code").regex(regex, "i"),
                    Criteria.where("name").regex(regex, "i")));
        }
        long total = mongoTemplate.count(query, AdminRoleEntity.class);
        Pageable pageable = request.getPageRequest();
        Sort sort = Sort.by(pageable.getSort().stream().filter(o -> SORTABLE.contains(o.getProperty())).toList());
        query.with(sort.isUnsorted() ? Sort.by(Sort.Direction.ASC, "code") : sort)
                .skip(pageable.getOffset()).limit(pageable.getPageSize());
        List<AdminRoleEntity> roles = mongoTemplate.find(query, AdminRoleEntity.class);
        Map<String, Long> counts = countUsers(roles.stream().map(AdminRoleEntity::getId).toList());
        List<AdminRoleRowDto> data = roles.stream().map(r -> AdminRoleRowDto.builder()
                .id(r.getId()).code(r.getCode()).name(r.getName()).description(r.getDescription())
                .userCount(counts.getOrDefault(r.getId(), 0L)).build()).toList();
        return PageResult.<AdminRoleRowDto>builder().totalCount(total).data(data).build();
    }

    @Override
    public AdminRoleDetailDto getDetail(String id) {
        return toDetail(load(id), userRepo.countByAdminRoleIdsContaining(id));
    }

    @Override
    public AdminRoleDetailDto create(AdminRoleUpsertDto request) {
        String code = request.getCode().trim();
        if (adminRoleRepo.existsByCode(code)) {
            throw new UserBusinessException(ErrorCode.ADMIN_ROLE_CODE_DUPLICATE);
        }
        List<String> perms = normalize(request.getPermissions());
        UserEntity actor = auditService.getCurrentUser();
        guardEscalation(actor, new HashSet<>(perms));
        AdminRoleEntity r = AdminRoleEntity.builder()
                .code(code).name(request.getName()).description(request.getDescription()).permissions(perms).build();
        r.setIsActive(true);
        r.setCreatedAt(Instant.now());
        r.setCreatedBy(actor.getUserId());
        r.setCreatedByEmail(actor.getEmail());
        AdminRoleEntity saved;
        try {
            saved = adminRoleRepo.save(r);
        } catch (DuplicateKeyException e) {
            // 2 request cung code gan nhu dong thoi, unique index chan o tang db
            throw new UserBusinessException(ErrorCode.ADMIN_ROLE_CODE_DUPLICATE);
        }
        audit(AuditAction.ADMIN_ROLE_CREATED, actor, saved, null, Map.of("permissions", perms));
        return toDetail(saved, 0);
    }

    @Override
    public AdminRoleDetailDto update(String id, AdminRoleUpsertDto request) {
        AdminRoleEntity r = load(id);
        List<String> before = r.getPermissions() == null ? List.of() : List.copyOf(r.getPermissions());
        List<String> after = normalize(request.getPermissions());
        // PUT thay ca mang: kiem ca quyen them lan quyen bo (G3) = hieu doi xung
        Set<String> diff = new HashSet<>(after);
        for (String p : before) {
            if (!diff.remove(p)) diff.add(p);
        }
        UserEntity actor = auditService.getCurrentUser();
        guardEscalation(actor, diff);
        // code bat bien: bo qua request.code
        r.setName(request.getName());
        r.setDescription(request.getDescription());
        r.setPermissions(after);
        r.setUpdatedAt(Instant.now());
        r.setUpdateBy(actor.getUserId());
        r.setUpdateByEmail(actor.getEmail());
        AdminRoleEntity saved = adminRoleRepo.save(r);
        audit(AuditAction.ADMIN_ROLE_UPDATED, actor, saved, Map.of("permissions", before), Map.of("permissions", after));
        return toDetail(saved, userRepo.countByAdminRoleIdsContaining(id));
    }

    @Override
    public void delete(String id) {
        AdminRoleEntity r = load(id);
        // ponytail: dem roi xoa, khong atomic; gan nhom dung luc xoa co the de id mo coi (resolver bo qua id khong ton tai)
        if (userRepo.countByAdminRoleIdsContaining(id) > 0) {
            throw new UserBusinessException(ErrorCode.ADMIN_ROLE_IN_USE);
        }
        UserEntity actor = auditService.getCurrentUser();
        adminRoleRepo.deleteById(id);
        List<String> perms = r.getPermissions() == null ? List.of() : r.getPermissions();
        audit(AuditAction.ADMIN_ROLE_DELETED, actor, r, Map.of("permissions", perms), null);
    }

    @Override
    public List<AdminPermissionGroupDto> permissionCatalogue() {
        Map<String, Map<String, List<String>>> tree = new LinkedHashMap<>();
        for (AdminPermission p : AdminPermission.values()) {
            tree.computeIfAbsent(p.getGroup(), k -> new LinkedHashMap<>())
                    .computeIfAbsent(p.getResource(), k -> new ArrayList<>()).add(p.getPermissionName());
        }
        return tree.entrySet().stream().map(g -> AdminPermissionGroupDto.builder().group(g.getKey())
                .resources(g.getValue().entrySet().stream().map(e -> AdminPermissionGroupDto.Resource.builder()
                        .resource(e.getKey()).permissions(e.getValue()).build()).toList())
                .build()).toList();
    }

    private AdminRoleEntity load(String id) {
        return adminRoleRepo.findById(id)
                .orElseThrow(() -> new UserBusinessException(ErrorCode.ADMIN_ROLE_NOT_FOUND));
    }

    // chuan hoa: tap khong trung, sap xep; ten la -> ADMIN_PERMISSION_UNKNOWN
    private List<String> normalize(List<String> input) {
        Set<String> catalogue = AdminPermission.allNames();
        TreeSet<String> out = new TreeSet<>();
        for (String p : input) {
            if (p == null || !catalogue.contains(p)) {
                throw new UserBusinessException(ErrorCode.ADMIN_PERMISSION_UNKNOWN);
            }
            out.add(p);
        }
        return new ArrayList<>(out);
    }

    // G3: moi quyen them/bo phai thuoc quyen hieu luc cua actor
    private void guardEscalation(UserEntity actor, Set<String> changed) {
        if (!permissionResolver.effective(actor).containsAll(changed)) {
            throw new UserBusinessException(ErrorCode.ADMIN_PERMISSION_ESCALATION);
        }
    }

    // 1 aggregate cho ca trang: unwind adminRoleIds, group dem theo id nhom
    private Map<String, Long> countUsers(List<String> roleIds) {
        Map<String, Long> out = new HashMap<>();
        if (roleIds.isEmpty()) return out;
        List<Document> rows = mongoTemplate.aggregate(Aggregation.newAggregation(
                        Aggregation.match(Criteria.where("adminRoleIds").in(roleIds)),
                        Aggregation.unwind("adminRoleIds"),
                        Aggregation.match(Criteria.where("adminRoleIds").in(roleIds)),
                        Aggregation.group("adminRoleIds").count().as("n")),
                UserEntity.class, Document.class).getMappedResults();
        for (Document d : rows) out.put(String.valueOf(d.get("_id")), ((Number) d.get("n")).longValue());
        return out;
    }

    private AdminRoleDetailDto toDetail(AdminRoleEntity r, long userCount) {
        return AdminRoleDetailDto.builder().id(r.getId()).code(r.getCode()).name(r.getName())
                .description(r.getDescription()).userCount(userCount)
                .permissions(r.getPermissions() == null ? List.of() : r.getPermissions()).build();
    }

    private void audit(AuditAction action, UserEntity actor, AdminRoleEntity target,
                       Map<String, Object> before, Map<String, Object> after) {
        AuditLogEntity log = AuditLogEntity.builder()
                .actorId(actor.getUserId())
                .actorEmail(actor.getEmail())
                .actorType(AuditActorType.ADMIN)
                .action(action)
                .targetType(AuditTargetType.ADMIN_ROLE)
                .targetId(target.getId())
                .targetName(target.getCode())
                .projectId(null)
                .changes(before == null && after == null ? null : new AuditChanges(before, after))
                .timestamp(Instant.now())
                .build();
        log.setIsActive(true);
        log.setCreatedBy(actor.getUserId());
        log.setCreatedByEmail(actor.getEmail());
        auditLogRepo.save(log);
    }
}
