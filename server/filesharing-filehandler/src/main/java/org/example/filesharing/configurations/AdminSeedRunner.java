package org.example.filesharing.configurations;

import com.file.service.filesharing.core.enums.auth.AuthProvider;
import com.file.service.filesharing.core.enums.auth.UserGrantedRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.entities.models.user.AuthProviderInfo;
import org.example.filesharing.repositories.UserRepo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Hien tai: khi khoi dong, neu cau hinh admin.seed co hash va email chua ton tai thi tao 1 tai khoan
 * ROLE_USER + ROLE_SA. Khong bao gio ghi de hay cap role cho user da co; hash rong thi bo qua.
 * Luong goi: Spring goi sau mongoIndexBootstrapRunner (order 0) de unique index email da san sang.
 * Sau nay mo rong: seed them tai khoan tenant, tai khoan theo doi benchmark hoac worker;
 * khi do role tach khoi ROLE_SA va moi tai khoan seed co role rieng.
 */
@Slf4j
@Component
@Order(10)
@RequiredArgsConstructor
public class AdminSeedRunner implements ApplicationRunner {

    private final UserRepo userRepo;

    @Value("${admin.seed.email:}")
    private String email;
    @Value("${admin.seed.public-user-name:Admin}")
    private String publicUserName;
    @Value("${admin.seed.password-hash:}")
    private String passwordHash;

    @Override
    public void run(ApplicationArguments args) {
        if (passwordHash == null || passwordHash.isBlank() || email == null || email.isBlank()) {
            log.info("Bo qua seed admin vi thieu cau hinh email hoac hash");
            return;
        }
        if (userRepo.existsByEmail(email)) {
            return;
        }
        UserEntity admin = UserEntity.builder()
                .email(email)
                .publicUserName(publicUserName)
                .password(passwordHash)
                .userGrantedRoles(new ArrayList<>(List.of(UserGrantedRole.ROLE_USER, UserGrantedRole.ROLE_SA)))
                .enabled(true)
                .emailVerified(true)
                .providers(new ArrayList<>(List.of(AuthProviderInfo.builder()
                        .provider(AuthProvider.LOCAL).linkedAt(Instant.now()).build())))
                .build();
        admin.setCreatedAt(Instant.now());
        try {
            userRepo.save(admin);
            log.info("Da tao tai khoan admin seed {}", email);
        } catch (DuplicateKeyException e) {
            // chay song song nhieu instance, unique index chan o tang db
            log.info("Tai khoan admin seed da duoc tao boi tien trinh khac");
        }
    }
}
