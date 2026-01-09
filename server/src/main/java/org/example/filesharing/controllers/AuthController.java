package org.example.filesharing.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.dtos.auth.*;
import org.example.filesharing.entities.models.AuthProviderInfo;
import org.example.filesharing.entities.models.MetadataEntity;
import org.example.filesharing.enums.auth.AuthProvider;
import org.example.filesharing.services.MetadataService;
import org.example.filesharing.services.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;
    private final MetadataService metadataService;

    @PostMapping("/register")
    public CommonResponse<UserRegisterResponseDto> register(@Valid @RequestBody UserRegisterRequestDto userRegisterRequestDto) {

        // TODO: implement logic dang nhap bang LOCAL va GOOGLE
        AuthProviderInfo authProviderInfo = new AuthProviderInfo();
        authProviderInfo.setProvider(AuthProvider.LOCAL);

        return CommonResponse.success(userService.registerUser(userRegisterRequestDto, authProviderInfo));
    }

    @PostMapping("/login")
    public CommonResponse<UserLoginResponseDto> login(@Valid @RequestBody UserLoginRequestDto userLoginRequestDto) {
        return CommonResponse.success(userService.loginUser(userLoginRequestDto));
    }

    @PostMapping("/check-legit/{shareToken}")
    public CommonResponse<MetadataEntity> checkLegit(@PathVariable("shareToken") String shareToken) {
        return CommonResponse.success(metadataService.checkUserOnFile(shareToken));
    }
}
