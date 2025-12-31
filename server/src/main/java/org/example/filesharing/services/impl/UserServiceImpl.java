package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.auth.UserLoginRequestDto;
import org.example.filesharing.entities.dtos.auth.UserLoginResponseDto;
import org.example.filesharing.entities.dtos.auth.UserRegisterRequestDto;
import org.example.filesharing.entities.dtos.auth.UserRegisterResponseDto;
import org.example.filesharing.entities.models.AuthProviderInfo;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.enums.auth.UserRole;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.exceptions.specException.UserBusinessException;
import org.example.filesharing.repositories.UserRepo;
import org.example.filesharing.services.JwtService;
import org.example.filesharing.services.UserService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Override
    public UserRegisterResponseDto registerUser(UserRegisterRequestDto input, AuthProviderInfo authProviderInfo) {

        if (!input.getPassword().equals(input.getConfirmPassword())) {
            throw new UserBusinessException(ErrorCode.USER_PASSWORD_NOT_VALID, "Passwords do not match");
        }
        String passwordHash = passwordEncoder.encode(input.getPassword());
        boolean isEmailVerified = verifyEmail(input.getEmail());

        UserEntity userEntity = UserEntity.builder()
                .email(input.getEmail())
                .password(passwordHash)
                .roles(List.of(UserRole.ROLE_USER))
                .enabled(true)
                .emailVerified(isEmailVerified)
                .providers(List.of(authProviderInfo))
                .build();
        if (!input.getUserName().isBlank() && !input.getPassword().isEmpty()) {
            userEntity.setPublicUserName(input.getUserName());
        } else {
            // TODO: kiem tra lai cach tao userName neu input.getUserName() null hoac blank
            // tam thoi la lay ten email
            userEntity.setPublicUserName(input.getEmail().substring(0, input.getEmail().indexOf("@")));
        }
        UserEntity savedUser = userRepo.save(userEntity);

        var accessToken = jwtService.generateToken(savedUser);
        var refreshToken = jwtService.generateRefreshToken(savedUser);

        return UserRegisterResponseDto.builder()
                .userId(savedUser.getUserId())
                .email(savedUser.getEmail())
                .userName(savedUser.getPublicUserName())
                .createdAt(savedUser.getCreatedAt())
                .providers(savedUser.getProviders().parallelStream()
                        .map(AuthProviderInfo::getProvider)
                        .toList())
                .roles(savedUser.getRoles())
                .enabled(savedUser.isEnabled())
                .build();
    }

    @Override
    public UserLoginResponseDto loginUser(UserLoginRequestDto input) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        input.getEmail(),
                        input.getPassword()
                )
        );

        UserEntity user = userRepo.findByEmail(input.getEmail())
                .orElseThrow(() -> new UserBusinessException(ErrorCode.USER_NOT_FOUND));

        var accessToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);

        return UserLoginResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    // TODO: sau khi cau hinh Spring Security: can cau hinh verify Email
    boolean verifyEmail(String email) {
        return true;
    }
}
