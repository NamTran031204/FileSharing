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
import org.example.filesharing.services.UserService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepo userRepo;

    @Override
    public UserRegisterResponseDto registerUser(UserRegisterRequestDto input, AuthProviderInfo authProviderInfo) {

        if (!input.getPassword().equals(input.getConfirmPassword())) {
            throw new UserBusinessException(ErrorCode.USER_PASSWORD_NOT_VALID, "Passwords do not match");
        }
        //TODO: hash password
        String passwordHash = input.getPassword();
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
            userEntity.setUserName(input.getUserName());
        } else {
            // TODO: kiem tra lai cach tao userName neu input.getUserName() null hoac blank
            // tam thoi la lay ten email
            userEntity.setUserName(input.getEmail().substring(0, input.getEmail().indexOf("@")));
        }
        UserEntity savedUser = userRepo.save(userEntity);

        UserRegisterResponseDto response = UserRegisterResponseDto.builder()
                .userId(savedUser.getUserId())
                .email(savedUser.getEmail())
                .userName(savedUser.getUserName())
                .createdAt(savedUser.getCreatedAt())
                .providers(savedUser.getProviders().parallelStream()
                        .map(AuthProviderInfo::getProvider)
                        .toList())
                .roles(savedUser.getRoles())
                .enabled(savedUser.isEnabled())
                .build();
        return response;
    }

    @Override
    public UserLoginResponseDto loginUser(UserLoginRequestDto input) {
        UserEntity user = userRepo.findByEmail(input.getEmail())
                .orElseThrow(() -> new UserBusinessException(ErrorCode.USER_NOT_FOUND));

        //TODO: hash password
        String passwordHash = input.getPassword();
        if (!user.getPassword().equals(passwordHash)) {
            throw new UserBusinessException(ErrorCode.USER_PASSWORD_NOT_VALID, "Passwords do not correct");
        }

        // TODO: lay ra token khi login
        String token = "";

        return UserLoginResponseDto.builder().token(token).build();
    }

    // TODO: sau khi cau hinh Spring Security: can cau hinh verify Email
    boolean verifyEmail(String email) {
        return true;
    }
}
