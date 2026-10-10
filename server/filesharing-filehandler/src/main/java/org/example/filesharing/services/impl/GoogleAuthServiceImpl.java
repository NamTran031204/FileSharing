package org.example.filesharing.services.impl;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.file.service.filesharing.core.enums.auth.AuthProvider;
import com.file.service.filesharing.core.enums.auth.UserGrantedRole;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.UserBusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.dtos.auth.UserLoginResponseDto;
import org.example.filesharing.entities.dtos.file.EmailSenderRequestDto;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.entities.models.user.AuthProviderInfo;
import org.example.filesharing.enums.EmailType;
import org.example.filesharing.jobs.kafka.EmailProducer;
import org.example.filesharing.repositories.UserRepo;
import org.example.filesharing.services.GoogleAuthService;
import org.example.filesharing.services.JwtService;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleAuthServiceImpl implements GoogleAuthService {

    private final UserRepo userRepo;
    private final JwtService jwtService;
    private final GoogleIdTokenVerifier googleIdTokenVerifier;
    private final EmailProducer emailProducer;

    @Override
    public UserLoginResponseDto authenticateWithGoogle(String credential, boolean allowRegister) {
        GoogleIdToken idToken = verifyToken(credential);

        GoogleIdToken.Payload payload = idToken.getPayload();
        String sub = payload.getSubject();
        String email = payload.getEmail();
        Boolean emailVerified = payload.getEmailVerified();
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");

        if (emailVerified == null || !emailVerified) {
            throw new UserBusinessException(ErrorCode.USER_EMAIL_NOT_VERIFY);
        }

        UserEntity user = resolveUser(sub, email, name, picture, allowRegister);

        JwtService.TokenPair tokenPair = jwtService.generateTokenPair(user, AuthProvider.GOOGLE, sub);
        return UserLoginResponseDto.builder()
                .accessToken(tokenPair.accessToken())
                .refreshToken(tokenPair.refreshToken())
                .build();
    }

    private GoogleIdToken verifyToken(String credential) {
        GoogleIdToken idToken;
        try {
            idToken = googleIdTokenVerifier.verify(credential);
        } catch (Exception e) {
            // Khong lo ly do cu the ra response, chi log de debug
            log.error("Google ID token verify error: {}", e.getMessage());
            idToken = null;
        }
        if (idToken == null) {
            // verify() tra null (khong nem exception) khi sai audience/issuer/het han/chu ky sai
            log.warn("Google ID token verify tra null: kiem tra client-id backend khop client-id frontend, va dong ho may");
            throw new UserBusinessException(ErrorCode.GOOGLE_TOKEN_INVALID);
        }
        return idToken;
    }

    private UserEntity resolveUser(String sub, String email, String name, String picture, boolean allowRegister) {
        Optional<UserEntity> bySub = userRepo.findByProviderAndProviderId(AuthProvider.GOOGLE, sub);
        if (bySub.isPresent()) {
            return bySub.get();
        }

        Optional<UserEntity> byEmail = userRepo.findByEmail(email);
        if (byEmail.isPresent()) {
            return linkOrReuseExisting(byEmail.get(), sub);
        }

        return createNewGoogleUser(email, name, picture, sub, allowRegister);
    }

    private UserEntity linkOrReuseExisting(UserEntity existing, String sub) {
        boolean hasOtherGoogleIdentity = existing.getProviders().stream()
                .anyMatch(p -> p.getProvider() == AuthProvider.GOOGLE && !sub.equals(p.getProviderId()));
        if (hasOtherGoogleIdentity) {
            // Email bi cap lai/doi chu, mot Google identity khac dang chiem email nay -> tu choi
            throw new UserBusinessException(ErrorCode.USER_NOT_FOUND);
        }

        if (existing.hasProvider(AuthProvider.GOOGLE)) {
            return existing;
        }

        existing.addProvider(AuthProvider.GOOGLE, sub);
        UserEntity saved = userRepo.save(existing);
        try {
            sendGoogleLinkedWarningEmail(saved.getEmail());
        } catch (Exception e) {
            // Khong de loi gui email canh bao lam hong response cua 1 lan auth da thanh cong that su
            log.error("Gui email canh bao lien ket Google that bai cho user {}: {}", saved.getEmail(), e.getMessage());
        }
        return saved;
    }

    private UserEntity createNewGoogleUser(String email, String name, String picture, String sub, boolean allowRegister) {
        if (!allowRegister) {
            throw new UserBusinessException(ErrorCode.USER_NOT_FOUND);
        }

        String publicUserName = (name != null && !name.isBlank()) ? name : email.substring(0, email.indexOf("@"));

        UserEntity newUser = UserEntity.builder()
                .email(email)
                .password(null)
                .publicUserName(publicUserName)
                .userGrantedRoles(List.of(UserGrantedRole.ROLE_USER))
                .enabled(true)
                .emailVerified(true)
                .providers(new ArrayList<>(List.of(AuthProviderInfo.builder()
                        .provider(AuthProvider.GOOGLE)
                        .providerId(sub)
                        .linkedAt(Instant.now())
                        .build())))
                // @Builder cua UserEntity khong co @Builder.Default cho metadata -> phai set tay,
                // neu khong getMetadata() se null va NPE khi put avatarUrl ben duoi
                .metadata(new HashMap<>())
                .build();
        if (picture != null) {
            newUser.getMetadata().put("avatarUrl", picture);
        }

        try {
            return userRepo.save(newUser);
        } catch (DuplicateKeyException e) {
            // Race condition: 2 request Google register cung email gan nhu dong thoi
            return userRepo.findByEmail(email)
                    .orElseThrow(() -> new UserBusinessException(ErrorCode.GOOGLE_TOKEN_INVALID));
        }
    }

    private void sendGoogleLinkedWarningEmail(String toEmail) {
        EmailSenderRequestDto dto = new EmailSenderRequestDto();
        dto.setToEmail(toEmail);
        dto.setType(EmailType.GOOGLE_ACCOUNT_LINKED);
        emailProducer.sendEmail(dto);
    }
}
