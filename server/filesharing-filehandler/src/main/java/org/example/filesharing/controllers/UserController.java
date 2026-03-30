package org.example.filesharing.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.user.UpdateUserRequestDto;
import org.example.filesharing.entities.dtos.user.UserDto;
import org.example.filesharing.entities.dtos.user.UserSearchRequestDto;
import org.example.filesharing.services.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Get user by ID
     *
     * @param userId user ID
     * @return user information
     */
    @GetMapping("/{userId}")
    public CommonResponse<UserDto> getUserById(@PathVariable("userId") String userId) {
        return CommonResponse.success(userService.getUserById(userId));
    }

    @GetMapping("")
    public CommonResponse<UserDto> getCurrentUser() {
        return CommonResponse.success(userService.getUserById(""));
    }

    /**
     * Get user by email
     *
     * @param email user email
     * @return user information
     */
    @GetMapping("/email/{email}")
    public CommonResponse<UserDto> getUserByEmail(@PathVariable("email") String email) {
        return CommonResponse.success(userService.getUserByEmail(email));
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

    /**
     * Delete user by ID
     *
     * @param userId user ID
     * @return success response
     */
    @DeleteMapping("/{userId}")
    public CommonResponse<String> deleteUser(@PathVariable("userId") String userId) {
        userService.deleteUser(userId);
        return CommonResponse.success("User deleted successfully");
    }

    /**
     * Search users by username or email with pagination
     *
     * @param pageRequest pagination and search request
     * @return paginated list of users
     */
    @PostMapping("/search")
    public CommonResponse<PageResult<UserDto>> searchUsers(
            @RequestBody PageRequestDto<UserSearchRequestDto> pageRequest) {
        return CommonResponse.success(userService.searchUsers(pageRequest));
    }
}
