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
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.entities.models.user.AuthProviderInfo;
import org.example.filesharing.repositories.AuditLogRepo;
import org.example.filesharing.repositories.UserRepo;
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

    @Override
    public PageResult<AdminUserRowDto> getPaged(PageRequestDto<AdminUserFilterDto> request) {
        Query query = new Query();
        AdminUserFilterDto f = request.getFilter();
        if (f != null) {
            if (!StringUtils.isNullOrBlank(f.getSearchText())) {
                String regex = Pattern.quote(f.getSearchText().trim());
                query.addCriteria(new Criteria().orOperator(
                        Criteria.where("email").regex(regex, "i"),
                        Criteria.where("publicUserName").regex(regex, "i")));
            }
            if (f.getRole() != null) query.addCriteria(Criteria.where("userGrantedRoles").is(f.getRole()));
            if (f.getEnabled() != null) query.addCriteria(Criteria.where("enabled").is(f.getEnabled()));
            if (f.getProvider() != null) query.addCriteria(Criteria.where("providers.provider").is(f.getProvider()));
        }
        long total = mongoTemplate.count(query, UserEntity.class);

        Pageable pageable = request.getPageRequest();
        Sort sort = Sort.by(pageable.getSort().stream().filter(o -> SORTABLE.contains(o.getProperty())).toList());
        query.with(sort.isUnsorted() ? Sort.by(Sort.Direction.DESC, "createdAt") : sort)
                .skip(pageable.getOffset()).limit(pageable.getPageSize());
        List<AdminUserRowDto> data = mongoTemplate.find(query, UserEntity.class).stream().map(this::toRow).toList();
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
        boolean before = u.isEnabled();
        u.setEnabled(true);
        userRepo.save(u);
        audit(AuditAction.USER_UNLOCKED, u, Map.of("enabled", before), Map.of("enabled", true));
        return toRow(u);
    }

    @Override
    public AdminUserRowDto updateRoles(String userId, AdminRoleUpdateDto request) {
        UserEntity u = load(userId);
        // ROLE_USER luon co
        LinkedHashSet<UserGrantedRole> next = new LinkedHashSet<>();
        next.add(UserGrantedRole.ROLE_USER);
        next.addAll(request.getRoles());
        List<UserGrantedRole> before = u.getUserGrantedRoles() == null ? List.of() : List.copyOf(u.getUserGrantedRoles());
        if (before.contains(UserGrantedRole.ROLE_SA) && !next.contains(UserGrantedRole.ROLE_SA)) {
            guardSelf(userId);
            guardLastSa(u);
        }
        u.setUserGrantedRoles(new ArrayList<>(next));
        userRepo.save(u);
        audit(AuditAction.USER_ROLES_CHANGED, u, Map.of("roles", names(before)), Map.of("roles", names(next)));
        return toRow(u);
    }

    @Override
    public AdminUserRowDto revokeSessions(String userId) {
        UserEntity u = load(userId);
        // cat ve giay de khop cach so sanh iat cua jwt filter
        u.setSessionsValidAfter(Instant.now().truncatedTo(ChronoUnit.SECONDS));
        userRepo.save(u);
        audit(AuditAction.SESSIONS_REVOKED, u, null, null);
        return toRow(u);
    }

    /**
     * Hien tai: SA tao tai khoan van hanh (ROLE_USER + ROLE_SA) bang email, ten hien thi, mat khau.
     * Luong goi: nut tao tai khoan van hanh o AdminUserPage, goi POST /api/admin/users, roi toi ham nay.
     * Sau nay mo rong: tao tai khoan tenant, tai khoan theo doi benchmark hoac worker;
     * khi do role cua tai khoan van hanh se tach khoi ROLE_SA va ham nhan them tham so role.
     */
    @Override
    public AdminUserRowDto createOperatorAccount(AdminCreateUserRequestDto request) {
        String email = request.getEmail().trim();
        if (userRepo.existsByEmail(email)) {
            throw new UserBusinessException(ErrorCode.USER_ALREADY_EXISTS, "error.user.alreadyExists");
        }
        UserEntity u = UserEntity.builder()
                .email(email)
                .publicUserName(request.getPublicUserName().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .userGrantedRoles(new ArrayList<>(List.of(UserGrantedRole.ROLE_USER, UserGrantedRole.ROLE_SA)))
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
        audit(AuditAction.USER_CREATED, saved, null, Map.of("roles", names(saved.getUserGrantedRoles())));
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

    // chan khi target la SA dang enabled va la nguoi cuoi cung
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

    private AdminUserRowDto toRow(UserEntity u) {
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
                .build();
    }
}
