package org.example.filesharing.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import com.file.service.filesharing.core.entity.CommonResponse;
import org.example.filesharing.entities.dtos.auth.GoogleAuthRequestDto;
import org.example.filesharing.entities.dtos.auth.UserLoginRequestDto;
import org.example.filesharing.entities.dtos.auth.UserLoginResponseDto;
import org.example.filesharing.entities.dtos.auth.UserRegisterRequestDto;
import org.example.filesharing.entities.dtos.auth.UserRegisterResponseDto;
import org.example.filesharing.entities.models.user.AuthProviderInfo;
import com.file.service.filesharing.core.entity.models.MetadataEntity;
import com.file.service.filesharing.core.enums.auth.AuthProvider;
import org.example.filesharing.services.GoogleAuthService;
import org.example.filesharing.services.MetadataService;
import org.example.filesharing.services.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;
    private final MetadataService metadataService;
    private final GoogleAuthService googleAuthService;

    @PostMapping("/register")
    public CommonResponse<UserRegisterResponseDto> register(@Valid @RequestBody UserRegisterRequestDto userRegisterRequestDto) {

        AuthProviderInfo authProviderInfo = new AuthProviderInfo();
        authProviderInfo.setProvider(AuthProvider.LOCAL);

        return CommonResponse.success(userService.registerUser(userRegisterRequestDto, authProviderInfo));
    }

    @PostMapping("/login")
    public CommonResponse<UserLoginResponseDto> login(@Valid @RequestBody UserLoginRequestDto userLoginRequestDto) {
        return CommonResponse.success(userService.loginUser(userLoginRequestDto));
    }

    @PostMapping("/google/register")
    public CommonResponse<UserLoginResponseDto> googleRegister(@Valid @RequestBody GoogleAuthRequestDto googleAuthRequestDto) {
        return CommonResponse.success(googleAuthService.authenticateWithGoogle(googleAuthRequestDto.getCredential(), true));
    }

    @PostMapping("/google/login")
    public CommonResponse<UserLoginResponseDto> googleLogin(@Valid @RequestBody GoogleAuthRequestDto googleAuthRequestDto) {
        return CommonResponse.success(googleAuthService.authenticateWithGoogle(googleAuthRequestDto.getCredential(), false));
    }

    @PostMapping("/check-legit/{shareToken}")
    public CommonResponse<MetadataEntity> checkLegit(@PathVariable("shareToken") String shareToken) {
        return CommonResponse.success(metadataService.checkUserOnFile(shareToken));
    }
}
