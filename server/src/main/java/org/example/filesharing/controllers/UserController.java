package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.dtos.user.UserLoginRequestDto;
import org.example.filesharing.entities.dtos.user.UserLoginResponseDto;
import org.example.filesharing.entities.dtos.user.UserRegisterRequestDto;
import org.example.filesharing.entities.dtos.user.UserRegisterResponseDto;
import org.example.filesharing.exceptions.ErrorCode;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/user")
@RequiredArgsConstructor
public class UserController {


    @PostMapping("/register")
    public CommonResponse<UserRegisterResponseDto> register(@RequestBody UserRegisterRequestDto userRegisterRequestDto) {
        return CommonResponse.fail(ErrorCode.MONGO_ERROR, "hehe");
    }

    @PostMapping("/login")
    public CommonResponse<UserLoginResponseDto> login(@RequestBody UserLoginRequestDto userLoginRequestDto) {
        return CommonResponse.success();
    }
}
