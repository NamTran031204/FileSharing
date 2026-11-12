package org.example.filesharing.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import com.file.service.filesharing.core.entity.CommonResponse;
import org.example.filesharing.entities.dtos.user.UpdateUserRequestDto;
import org.example.filesharing.entities.dtos.user.UserDto;
import org.example.filesharing.services.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("")
    public CommonResponse<UserDto> getCurrentUser() {
        return CommonResponse.success(userService.getUserById(""));
    }

    /**
     * Update user by ID
     *
     * @param userId  user ID
     * @param request update request
     * @return updated user information
     */
    @PutMapping("/{userId}")
    public CommonResponse<UserDto> updateUser(
            @PathVariable("userId") String userId,
            @Valid @RequestBody UpdateUserRequestDto request) {
        return CommonResponse.success(userService.updateUser(userId, request));
    }
}
