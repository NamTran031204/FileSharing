package org.example.filesharing.controllers;

import com.file.service.filesharing.core.entity.CommonResponse;
import com.file.service.filesharing.core.entity.PageRequestDto;
import com.file.service.filesharing.core.entity.PageResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.admin.*;
import org.example.filesharing.services.AdminUserService;
import org.springframework.web.bind.annotation.*;

// cong ROLE_SA da chan o SecurityConfig cho moi duong dan /api/admin
// khong co endpoint xoa user: khoa thay cho xoa de tranh du lieu mo coi
@RestController
@RequestMapping("api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @PostMapping("get-paged")
    public CommonResponse<PageResult<AdminUserRowDto>> getPaged(@RequestBody PageRequestDto<AdminUserFilterDto> request) {
        return CommonResponse.success(adminUserService.getPaged(request));
    }

    @GetMapping("{userId}")
    public CommonResponse<AdminUserDetailDto> getDetail(@PathVariable("userId") String userId) {
        return CommonResponse.success(adminUserService.getDetail(userId));
    }

    /**
     * Hien tai: tao tai khoan van hanh co ROLE_USER va ROLE_SA, goi tu nut tao tai khoan van hanh tren AdminUserPage.
     * Sau nay mo rong: tao tai khoan tenant, tai khoan theo doi benchmark hoac worker;
     * khi do role tach khoi ROLE_SA va request nhan them role can cap.
     */
    @PostMapping("")
    public CommonResponse<AdminUserRowDto> create(@Valid @RequestBody AdminCreateUserRequestDto request) {
        return CommonResponse.success(adminUserService.createOperatorAccount(request));
    }

    @PostMapping("{userId}/lock")
    public CommonResponse<AdminUserRowDto> lock(@PathVariable("userId") String userId) {
        return CommonResponse.success(adminUserService.lock(userId));
    }

    @PostMapping("{userId}/unlock")
    public CommonResponse<AdminUserRowDto> unlock(@PathVariable("userId") String userId) {
        return CommonResponse.success(adminUserService.unlock(userId));
    }

    @PostMapping("{userId}/revoke-sessions")
    public CommonResponse<AdminUserRowDto> revokeSessions(@PathVariable("userId") String userId) {
        return CommonResponse.success(adminUserService.revokeSessions(userId));
    }

    @PutMapping("{userId}/roles")
    public CommonResponse<AdminUserRowDto> updateRoles(@PathVariable("userId") String userId,
                                                       @Valid @RequestBody AdminRoleUpdateDto request) {
        return CommonResponse.success(adminUserService.updateRoles(userId, request));
    }
}
