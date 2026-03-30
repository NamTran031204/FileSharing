package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.auth.UserLoginRequestDto;
import org.example.filesharing.entities.dtos.auth.UserLoginResponseDto;
import org.example.filesharing.entities.dtos.auth.UserRegisterRequestDto;
import org.example.filesharing.entities.dtos.auth.UserRegisterResponseDto;
import org.example.filesharing.entities.dtos.user.UpdateUserRequestDto;
import org.example.filesharing.entities.dtos.user.UserDto;
import org.example.filesharing.entities.dtos.user.UserSearchRequestDto;
import org.example.filesharing.entities.models.AuthProviderInfo;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.enums.auth.AuthProvider;
import org.example.filesharing.enums.auth.UserRole;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.exceptions.specException.UserBusinessException;
import org.example.filesharing.repositories.UserRepo;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.JwtService;
import org.example.filesharing.services.UserService;
import org.example.filesharing.utils.StringUtils;
import org.springframework.data.domain.Page;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final AuditService auditService;

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

    @Override
    public UserDto getUserById(String userId) {
        UserEntity user = userRepo.findById(userId.isBlank() || userId.isEmpty() ? auditService.getCurrentUserId() : userId)
                .orElseThrow(() -> new UserBusinessException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy user với id: " + userId));
        return mapToUserDto(user);
    }

    @Override
    public UserDto getUserByEmail(String email) {
        UserEntity user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UserBusinessException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy user với email: " + email));
        return mapToUserDto(user);
    }

    @Override
    public UserDto updateUser(String userId, UpdateUserRequestDto input) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new UserBusinessException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy user với id: " + userId));

        if (!StringUtils.isNullOrBlank(input.getPublicUserName())) {
            user.setPublicUserName(input.getPublicUserName());
        }

        if (!StringUtils.isNullOrBlank(input.getPassword())) {
            user.setPassword(passwordEncoder.encode(input.getPassword()));
        }

        if (input.getRoles() != null && !input.getRoles().isEmpty()) {
            user.setRoles(input.getRoles());
        }

        if (input.getEnabled() != null) {
            user.setEnabled(input.getEnabled());
        }

        if (input.getEmailVerified() != null) {
            user.setEmailVerified(input.getEmailVerified());
        }

        UserEntity updatedUser = userRepo.save(user);
        return mapToUserDto(updatedUser);
    }

    @Override
    public void deleteUser(String userId) {
        if (!userRepo.existsById(userId)) {
            throw new UserBusinessException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy user với id: " + userId);
        }
        userRepo.deleteById(userId);
    }

    @Override
    public PageResult<UserDto> searchUsers(PageRequestDto<UserSearchRequestDto> pageRequest) {
        Page<UserEntity> userPage;

        UserSearchRequestDto filter = pageRequest.getFilter();
        String searchText = (filter != null && !StringUtils.isNullOrBlank(filter.getSearchText()))
                ? escapeRegex(filter.getSearchText().trim())
                : null;

        if (searchText != null) {
            userPage = userRepo.searchByUsernameOrEmail(searchText, pageRequest.getPageRequest());
        } else {
            userPage = userRepo.findAll(pageRequest.getPageRequest());
        }

        List<UserDto> userDtos = userPage.getContent().stream()
                .map(this::mapToUserDto)
                .toList();

        return PageResult.<UserDto>builder()
                .totalCount(userPage.getTotalElements())
                .data(userDtos)
                .build();
    }

    // TODO: sau khi cau hinh Spring Security: can cau hinh verify Email
    boolean verifyEmail(String email) {
        return true;
    }

    /**
     * Escape special regex characters to prevent regex injection
     */
    private String escapeRegex(String input) {
        return Pattern.quote(input);
    }

    /**
     * Map UserEntity to UserDto
     */
    private UserDto mapToUserDto(UserEntity user) {
        return UserDto.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .publicUserName(user.getPublicUserName())
                .roles(user.getRoles())
                .enabled(user.isEnabled())
                .emailVerified(user.isEmailVerified())
                .providers(user.getProviders() != null
                        ? user.getProviders().stream().map(AuthProviderInfo::getProvider).toList()
                        : List.of())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }
}
