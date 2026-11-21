package org.example.filesharing.controllers;

import com.file.service.filesharing.core.entity.CommonResponse;
import com.file.service.filesharing.core.entity.PageRequestDto;
import com.file.service.filesharing.core.entity.PageResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.admin.*;
import org.example.filesharing.services.AdminRoleService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

// cong phia quan tri o SecurityConfig, tung hanh dong do @PreAuthorize theo AdminPermission
@RestController
@RequestMapping("api/admin/roles")
@RequiredArgsConstructor
public class AdminRoleController {

    private final AdminRoleService adminRoleService;

    @PostMapping("get-paged")
    @PreAuthorize("hasAuthority('Admin.Role.GetPaged')")
    public CommonResponse<PageResult<AdminRoleRowDto>> getPaged(@RequestBody PageRequestDto<AdminRoleFilterDto> request) {
        return CommonResponse.success(adminRoleService.getPaged(request));
    }

    @GetMapping("{id}")
    @PreAuthorize("hasAuthority('Admin.Role.GetDetail')")
    public CommonResponse<AdminRoleDetailDto> getDetail(@PathVariable("id") String id) {
        return CommonResponse.success(adminRoleService.getDetail(id));
    }

    @PostMapping("")
    @PreAuthorize("hasAuthority('Admin.Role.Create')")
    public CommonResponse<AdminRoleDetailDto> create(@Valid @RequestBody AdminRoleUpsertDto request) {
        return CommonResponse.success(adminRoleService.create(request));
    }

    @PutMapping("{id}")
    @PreAuthorize("hasAuthority('Admin.Role.Update')")
    public CommonResponse<AdminRoleDetailDto> update(@PathVariable("id") String id,
                                                     @Valid @RequestBody AdminRoleUpsertDto request) {
        return CommonResponse.success(adminRoleService.update(id, request));
    }

    @DeleteMapping("{id}")
    @PreAuthorize("hasAuthority('Admin.Role.Delete')")
    public CommonResponse<Void> delete(@PathVariable("id") String id) {
        adminRoleService.delete(id);
        return CommonResponse.success(null);
    }
}
