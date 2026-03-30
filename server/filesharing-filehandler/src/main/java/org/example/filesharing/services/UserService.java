package org.example.filesharing.services;

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

public interface UserService {
    // Authentication methods
    UserRegisterResponseDto registerUser(UserRegisterRequestDto input, AuthProviderInfo authProviderInfo);

    UserLoginResponseDto loginUser(UserLoginRequestDto input);

    // CRUD methods
    UserDto getUserById(String userId);

    UserDto getUserByEmail(String email);

    UserDto updateUser(String userId, UpdateUserRequestDto input);

    void deleteUser(String userId);

    PageResult<UserDto> searchUsers(PageRequestDto<UserSearchRequestDto> pageRequest);
}
