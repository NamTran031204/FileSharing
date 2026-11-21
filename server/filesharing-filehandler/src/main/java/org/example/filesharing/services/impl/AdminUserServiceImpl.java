package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.PageRequestDto;
import com.file.service.filesharing.core.entity.PageResult;
import com.file.service.filesharing.core.entity.models.AuditLogEntity;
import com.file.service.filesharing.core.entity.models.MetadataEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.entity.models.auditlog.AuditChanges;
import com.file.service.filesharing.core.enums.AuditAction;
import com.file.service.filesharing.core.enums.AuditActorType;
import com.file.service.filesharing.core.enums.AuditTargetType;
import com.file.service.filesharing.core.enums.auth.AuthProvider;
import com.file.service.filesharing.core.enums.auth.UserGrantedRole;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.UserBusinessException;
import com.file.service.filesharing.core.utils.StringUtils;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.example.filesharing.entities.dtos.admin.*;
import org.example.filesharing.entities.models.AdminRoleEntity;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.entities.models.user.AuthProviderInfo;
import org.example.filesharing.repositories.AdminRoleRepo;
import org.example.filesharing.repositories.AuditLogRepo;
import org.example.filesharing.repositories.UserRepo;
import org.example.filesharing.services.AdminPermissionResolver;
import org.example.filesharing.services.AdminUserService;
import org.example.filesharing.services.AuditService;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    // chi cho sort theo cac cot hien thi, khong sort theo password hay providers
    private static final Set<String> SORTABLE = Set.of("email", "publicUserName", "createdAt", "lastLoginAt", "enabled");

    private final UserRepo userRepo;
    private final MongoTemplate mongoTemplate;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final AuditLogRepo auditLogRepo;
    private final AdminRoleRepo adminRoleRepo;
    private final AdminPermissionResolver permissionResolver;

    @Override
    public PageResult<AdminUserRowDto> getPaged(PageRequestDto<AdminUserFilterDto> request) {
        Query query = new Query();
        AdminUserFilterDto f = request.getFilter();
        if (f != null) {
            // moi dieu kien vao $and de khong trung khoa (role va adminSide cung tren userGrantedRoles)
            List<Criteria> and = new ArrayList<>();
            if (!StringUtils.isNullOrBlank(f.getSearchText())) {
                String regex = Pattern.quote(f.getSearchText().trim());
                and.add(new Criteria().orOperator(
                        Criteria.where("email").regex(regex, "i"),
                        Criteria.where("publicUserName").regex(regex, "i")));
            }
            if (f.getRole() != null) and.add(Criteria.where("userGrantedRoles").is(f.getRole()));
            if (f.getAdminSide() != null) {
                and.add(f.getAdminSide() ? Criteria.where("userGrantedRoles").ne(UserGrantedRole.ROLE_USER)
                        : Criteria.where("userGrantedRoles").is(UserGrantedRole.ROLE_USER));
            }
            if (f.getEnabled() != null) and.add(Criteria.where("enabled").is(f.getEnabled()));
            if (f.getProvider() != null) and.add(Criteria.where("providers.provider").is(f.getProvider()));
            if (!StringUtils.isNullOrBlank(f.getAdminRoleId())) and.add(Criteria.where("adminRoleIds").is(f.getAdminRoleId()));
            if (!and.isEmpty()) query.addCriteria(new Criteria().andOperator(and));
        }
        long total = mongoTemplate.count(query, UserEntity.class);

        Pageable pageable = request.getPageRequest();
        Sort sort = Sort.by(pageable.getSort().stream().filter(o -> SORTABLE.contains(o.getProperty())).toList());
        query.with(sort.isUnsorted() ? Sort.by(Sort.Direction.DESC, "createdAt") : sort)
                .skip(pageable.getOffset()).limit(pageable.getPageSize());
        List<UserEntity> users = mongoTemplate.find(query, UserEntity.class);
        Map<String, AdminRoleEntity> roleMap = loadRoles(users);
        List<AdminUserRowDto> data = users.stream().map(u -> toRow(u, roleMap)).toList();
        return PageResult.<AdminUserRowDto>builder().totalCount(total).data(data).build();
    }

    @Override
    public AdminUserDetailDto getDetail(String userId) {
        UserEntity u = load(userId);
        long projects = mongoTemplate.count(new Query(Criteria.where("ownerId").is(userId)), ProjectEntity.class);
        Document agg = mongoTemplate.aggregate(Aggregation.newAggregation(
                        Aggregation.match(Criteria.where("ownerId").is(userId).and("isTrash").ne(true)),
                        Aggregation.group().count().as("fileCount").sum("fileSize").as("storageBytes")),
                MetadataEntity.class, Document.class).getUniqueMappedResult();
        long files = agg == null ? 0 : ((Number) agg.getOrDefault("fileCount", 0)).longValue();
        long bytes = agg == null ? 0 : ((Number) agg.getOrDefault("storageBytes", 0)).longValue();
        AdminUserRowDto r = toRow(u);
        return AdminUserDetailDto.builder()
                .userId(r.getUserId()).email(r.getEmail()).publicUserName(r.getPublicUserName())
                .roles(r.getRoles()).enabled(r.isEnabled()).emailVerified(r.isEmailVerified())
                .providers(r.getProviders()).createdAt(r.getCreatedAt()).lastLoginAt(r.getLastLoginAt())
                .ownedProjectCount(projects).fileCount(files).storageBytes(bytes)
                .sessionsValidAfter(u.getSessionsValidAfter())
                .build();
    }

    @Override
    public AdminUserRowDto lock(String userId) {
        UserEntity u = load(userId);
        guardSelf(userId);
        guardTarget(u);
        guardLastSa(u);
        boolean before = u.isEnabled();
        u.setEnabled(false);
        userRepo.save(u);
        audit(AuditAction.USER_LOCKED, u, Map.of("enabled", before), Map.of("enabled", false));
        return toRow(u);
    }

    @Override
    public AdminUserRowDto unlock(String userId) {
        UserEntity u = load(userId);
        guardTarget(u);
        boolean before = u.isEnabled();
        u.setEnabled(true);
        userRepo.save(u);
        audit(AuditAction.USER_UNLOCKED, u, Map.of("enabled", before), Map.of("enabled", true));
        return toRow(u);
    }

    @Override
    public AdminUserRowDto updateAdminRoles(String userId, AdminAssignRolesDto request) {
        UserEntity u = load(userId);
        UserEntity actor = auditService.getCurrentUser();
        // G5: chi gan cho tai khoan phia quan tri
        if (!AdminPermissionResolver.isAdminSide(u)) {
            throw new UserBusinessException(ErrorCode.ADMIN_ROLE_TARGET_INVALID);
        }
        boolean hadSa = hasSa(u);
        // G1: chi SA cap/go ROLE_SA
        if (hadSa != request.isSa() && !hasSa(actor)) {
            throw new UserBusinessException(ErrorCode.ADMIN_PERMISSION_ESCALATION);
        }
        // G2
        guardTarget(u);
        List<String> beforeIds = u.getAdminRoleIds() == null ? List.of() : List.copyOf(u.getAdminRoleIds());
        List<String> nextIds = new ArrayList<>(new LinkedHashSet<>(request.getAdminRoleIds()));
        // G4: quyen cua moi nhom them hoac go phai thuoc quyen cua actor
        Set<String> changed = new HashSet<>(nextIds);
        for (String id : beforeIds) {
            if (!changed.remove(id)) changed.add(id);
        }
        guardRolesEscalation(actor, changed, nextIds);
        if (hadSa && !request.isSa()) {
            guardSelf(userId);
            guardLastSa(u);
        }
        List<UserGrantedRole> beforeRoles = u.getUserGrantedRoles() == null ? List.of() : List.copyOf(u.getUserGrantedRoles());
        u.setUserGrantedRoles(request.isSa() ? new ArrayList<>(List.of(UserGrantedRole.ROLE_SA)) : new ArrayList<>());
        u.setAdminRoleIds(nextIds);
        userRepo.save(u);
        audit(AuditAction.USER_ADMIN_ROLES_CHANGED, u,
                Map.of("roles", names(beforeRoles), "adminRoleIds", beforeIds),
                Map.of("roles", names(u.getUserGrantedRoles()), "adminRoleIds", nextIds));
        return toRow(u);
    }

    @Override
    public AdminUserRowDto revokeSessions(String userId) {
        UserEntity u = load(userId);
        guardTarget(u);
        // cat ve giay de khop cach so sanh iat cua jwt filter
        u.setSessionsValidAfter(Instant.now().truncatedTo(ChronoUnit.SECONDS));
        userRepo.save(u);
        audit(AuditAction.SESSIONS_REVOKED, u, null, null);
        return toRow(u);
    }

    /**
     * Hien tai: tao tai khoan phia quan tri (khong ROLE_USER): [ROLE_SA] khi sa=true (chi SA gui duoc), nguoc lai []
     * va quyen den tu adminRoleIds (G1, G4 kiem o day).
     * Luong goi: nut tao tai khoan quan tri o AdminUserPage, goi POST /api/admin/users, roi toi ham nay.
     * Sau nay mo rong: tao tai khoan tenant, tai khoan theo doi benchmark hoac worker;
     * khi do ham nhan them tham so loai tai khoan.
     */
    @Override
    public AdminUserRowDto createOperatorAccount(AdminCreateUserRequestDto request) {
        UserEntity actor = auditService.getCurrentUser();
        // G1
        if (request.isSa() && !hasSa(actor)) {
            throw new UserBusinessException(ErrorCode.ADMIN_PERMISSION_ESCALATION);
        }
        List<String> roleIds = request.getAdminRoleIds() == null ? new ArrayList<>()
                : new ArrayList<>(new LinkedHashSet<>(request.getAdminRoleIds()));
        // G4
        guardRolesEscalation(actor, new HashSet<>(roleIds), roleIds);
        String email = request.getEmail().trim();
        if (userRepo.existsByEmail(email)) {
            throw new UserBusinessException(ErrorCode.USER_ALREADY_EXISTS, "error.user.alreadyExists");
        }
        UserEntity u = UserEntity.builder()
                .email(email)
                .publicUserName(request.getPublicUserName().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .userGrantedRoles(request.isSa() ? new ArrayList<>(List.of(UserGrantedRole.ROLE_SA)) : new ArrayList<>())
                .adminRoleIds(roleIds)
                .enabled(true)
                .emailVerified(true)
                .providers(new ArrayList<>(List.of(AuthProviderInfo.builder()
                        .provider(AuthProvider.LOCAL).linkedAt(Instant.now()).build())))
                .build();
        u.setCreatedAt(Instant.now());
        UserEntity saved;
        try {
            saved = userRepo.save(u);
        } catch (DuplicateKeyException e) {
            // 2 request cung email gan nhu dong thoi, unique index chan o tang db
            throw new UserBusinessException(ErrorCode.USER_ALREADY_EXISTS, "error.user.alreadyExists");
        }
        audit(AuditAction.USER_CREATED, saved, null, Map.of("roles", names(saved.getUserGrantedRoles()), "adminRoleIds", roleIds));
        return toRow(saved);
    }

    private UserEntity load(String userId) {
        return userRepo.findById(userId)
                .orElseThrow(() -> new UserBusinessException(ErrorCode.USER_NOT_FOUND, "error.user.notFoundById", userId));
    }

    private void guardSelf(String targetId) {
        if (targetId.equals(auditService.getCurrentUserId())) {
            throw new UserBusinessException(ErrorCode.ADMIN_SELF_ACTION_FORBIDDEN);
        }
    }

    private static boolean hasSa(UserEntity u) {
        return AdminPermissionResolver.isAdminSide(u) && u.getUserGrantedRoles() != null
                && u.getUserGrantedRoles().contains(UserGrantedRole.ROLE_SA);
    }

    // G2: chi thao tac tai khoan co effective(target) la tap con cua effective(actor); SA co du catalogue nen luon qua
    private void guardTarget(UserEntity target) {
        UserEntity actor = auditService.getCurrentUser();
        if (!permissionResolver.effective(actor).containsAll(permissionResolver.effective(target))) {
            throw new UserBusinessException(ErrorCode.ADMIN_TARGET_FORBIDDEN);
        }
    }

    // G4: id nhom phai ton tai (nextIds) va quyen cua cac nhom them/go (changed) phai thuoc quyen actor
    private void guardRolesEscalation(UserEntity actor, Set<String> changed, List<String> nextIds) {
        if (!nextIds.isEmpty() && adminRoleRepo.findAllById(nextIds).size() != nextIds.size()) {
            throw new UserBusinessException(ErrorCode.ADMIN_ROLE_NOT_FOUND);
        }
        if (changed.isEmpty()) return;
        Set<String> perms = new HashSet<>();
        for (AdminRoleEntity r : adminRoleRepo.findAllById(changed)) {
            if (r.getPermissions() != null) perms.addAll(r.getPermissions());
        }
        if (!permissionResolver.effective(actor).containsAll(perms)) {
            throw new UserBusinessException(ErrorCode.ADMIN_PERMISSION_ESCALATION);
        }
    }

    // chan khi target la SA dang enabled va la nguoi cuoi cung
    // ponytail: dem roi ghi, khong atomic; 2 SA khoa nhau cung luc co the con 0 SA, doi sang findAndModify co dieu kien khi can
    private void guardLastSa(UserEntity target) {
        boolean activeSa = target.isEnabled() && target.getUserGrantedRoles() != null
                && target.getUserGrantedRoles().contains(UserGrantedRole.ROLE_SA);
        if (activeSa && userRepo.countByUserGrantedRolesContainingAndEnabled(UserGrantedRole.ROLE_SA, true) <= 1) {
            throw new UserBusinessException(ErrorCode.ADMIN_LAST_SA);
        }
    }

    private void audit(AuditAction action, UserEntity target, Map<String, Object> before, Map<String, Object> after) {
        UserEntity actor = auditService.getCurrentUser();
        AuditLogEntity log = AuditLogEntity.builder()
                .actorId(actor.getUserId())
                .actorEmail(actor.getEmail())
                .actorType(AuditActorType.ADMIN)
                .action(action)
                .targetType(AuditTargetType.USER)
                .targetId(target.getUserId())
                .targetName(target.getEmail())
                .projectId(null)
                .changes(before == null && after == null ? null : new AuditChanges(before, after))
                .timestamp(Instant.now())
                .build();
        log.setIsActive(true);
        log.setCreatedBy(actor.getUserId());
        log.setCreatedByEmail(actor.getEmail());
        auditLogRepo.save(log);
    }

    private static List<String> names(Collection<UserGrantedRole> roles) {
        return roles.stream().map(Enum::name).toList();
    }

    private Map<String, AdminRoleEntity> loadRoles(Collection<UserEntity> users) {
        Set<String> ids = new HashSet<>();
        for (UserEntity u : users) if (u.getAdminRoleIds() != null) ids.addAll(u.getAdminRoleIds());
        Map<String, AdminRoleEntity> out = new HashMap<>();
        if (!ids.isEmpty()) adminRoleRepo.findAllById(ids).forEach(r -> out.put(r.getId(), r));
        return out;
    }

    private AdminUserRowDto toRow(UserEntity u) {
        return toRow(u, loadRoles(List.of(u)));
    }

    private AdminUserRowDto toRow(UserEntity u, Map<String, AdminRoleEntity> roleMap) {
        List<AdminUserRowDto.AdminRoleRef> refs = u.getAdminRoleIds() == null ? List.of()
                : u.getAdminRoleIds().stream().map(roleMap::get).filter(Objects::nonNull)
                .map(r -> new AdminUserRowDto.AdminRoleRef(r.getId(), r.getCode(), r.getName())).toList();
        return AdminUserRowDto.builder()
                .userId(u.getUserId())
                .email(u.getEmail())
                .publicUserName(u.getPublicUserName())
                .roles(u.getUserGrantedRoles())
                .enabled(u.isEnabled())
                .emailVerified(u.isEmailVerified())
                .providers(u.getProviders() == null ? List.of()
                        : u.getProviders().stream().map(AuthProviderInfo::getProvider).toList())
                .createdAt(u.getCreatedAt())
                .lastLoginAt(u.getLastLoginAt())
                .adminRoles(refs)
                .adminSide(AdminPermissionResolver.isAdminSide(u))
                .build();
    }
}
