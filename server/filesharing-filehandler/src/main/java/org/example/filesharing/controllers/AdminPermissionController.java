package org.example.filesharing.controllers;

import com.file.service.filesharing.core.entity.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.admin.AdminPermissionGroupDto;
import org.example.filesharing.services.AdminRoleService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// catalogue permission cho cay phan quyen o man Nhom quyen
@RestController
@RequestMapping("api/admin/permissions")
@RequiredArgsConstructor
public class AdminPermissionController {

    private final AdminRoleService adminRoleService;

    @GetMapping("")
    @PreAuthorize("hasAuthority('Admin.Role.GetPaged')")
    public CommonResponse<List<AdminPermissionGroupDto>> catalogue() {
        return CommonResponse.success(adminRoleService.permissionCatalogue());
    }
}
