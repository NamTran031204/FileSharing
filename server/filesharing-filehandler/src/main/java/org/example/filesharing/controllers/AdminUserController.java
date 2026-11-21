package org.example.filesharing.controllers;

import com.file.service.filesharing.core.entity.CommonResponse;
import com.file.service.filesharing.core.entity.PageRequestDto;
import com.file.service.filesharing.core.entity.PageResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.admin.*;
import org.example.filesharing.services.AdminUserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

// cong phia quan tri (khong ROLE_USER) o SecurityConfig, tung hanh dong do @PreAuthorize theo AdminPermission
// khong co endpoint xoa user: khoa thay cho xoa de tranh du lieu mo coi
@RestController
@RequestMapping("api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @PostMapping("get-paged")
    @PreAuthorize("hasAuthority('Admin.User.GetPaged')")
    public CommonResponse<PageResult<AdminUserRowDto>> getPaged(@RequestBody PageRequestDto<AdminUserFilterDto> request) {
        return CommonResponse.success(adminUserService.getPaged(request));
    }

    @GetMapping("{userId}")
    @PreAuthorize("hasAuthority('Admin.User.GetDetail')")
    public CommonResponse<AdminUserDetailDto> getDetail(@PathVariable("userId") String userId) {
        return CommonResponse.success(adminUserService.getDetail(userId));
    }

    /**
     * Hien tai: tao tai khoan phia quan tri (khong ROLE_USER): [ROLE_SA] khi sa=true (chi SA gui duoc), nguoc lai [] va quyen den tu adminRoleIds.
     * Luong goi: nut tao tai khoan quan tri tren AdminUserPage.
     * Sau nay mo rong: tao tai khoan tenant, tai khoan theo doi benchmark hoac worker.
     */
    @PostMapping("")
    @PreAuthorize("hasAuthority('Admin.User.Create')")
    public CommonResponse<AdminUserRowDto> create(@Valid @RequestBody AdminCreateUserRequestDto request) {
        return CommonResponse.success(adminUserService.createOperatorAccount(request));
    }

    @PostMapping("{userId}/lock")
    @PreAuthorize("hasAuthority('Admin.User.Lock')")
    public CommonResponse<AdminUserRowDto> lock(@PathVariable("userId") String userId) {
        return CommonResponse.success(adminUserService.lock(userId));
    }

    @PostMapping("{userId}/unlock")
    @PreAuthorize("hasAuthority('Admin.User.Lock')")
    public CommonResponse<AdminUserRowDto> unlock(@PathVariable("userId") String userId) {
        return CommonResponse.success(adminUserService.unlock(userId));
    }

    @PostMapping("{userId}/revoke-sessions")
    @PreAuthorize("hasAuthority('Admin.User.RevokeSession')")
    public CommonResponse<AdminUserRowDto> revokeSessions(@PathVariable("userId") String userId) {
        return CommonResponse.success(adminUserService.revokeSessions(userId));
    }

    @PutMapping("{userId}/admin-roles")
    @PreAuthorize("hasAuthority('Admin.User.AssignRole')")
    public CommonResponse<AdminUserRowDto> updateAdminRoles(@PathVariable("userId") String userId,
                                                            @Valid @RequestBody AdminAssignRolesDto request) {
        return CommonResponse.success(adminUserService.updateAdminRoles(userId, request));
    }
}
