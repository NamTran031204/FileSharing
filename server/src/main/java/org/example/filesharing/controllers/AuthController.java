package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.dtos.auth.UserLoginRequestDto;
import org.example.filesharing.entities.dtos.auth.UserLoginResponseDto;
import org.example.filesharing.entities.dtos.auth.UserRegisterRequestDto;
import org.example.filesharing.entities.dtos.auth.UserRegisterResponseDto;
import org.example.filesharing.entities.models.AuthProviderInfo;
import org.example.filesharing.enums.auth.AuthProvider;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.services.UserService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;

    @PostMapping("/register")
    public CommonResponse<UserRegisterResponseDto> register(@RequestBody UserRegisterRequestDto userRegisterRequestDto) {

        // TODO: implement logic dang nhap bang LOCAL va GOOGLE
        AuthProviderInfo authProviderInfo = new AuthProviderInfo();
        authProviderInfo.setProvider(AuthProvider.LOCAL);

        return CommonResponse.success(userService.registerUser(userRegisterRequestDto, authProviderInfo));
    }

    @PostMapping("/login")
    public CommonResponse<UserLoginResponseDto> login(@RequestBody UserLoginRequestDto userLoginRequestDto) {
        return CommonResponse.success(userService.loginUser(userLoginRequestDto));
    }
}
