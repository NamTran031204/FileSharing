package org.example.filesharing.controllers;

import com.file.service.filesharing.core.entity.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.admin.AdminMailTestRequestDto;
import org.example.filesharing.entities.dtos.admin.AdminMailTestResultDto;
import org.example.filesharing.services.AdminEmailTemplateService;
import org.example.filesharing.entities.dtos.admin.AdminSettingGroupDto;
import org.example.filesharing.entities.dtos.admin.AdminSettingItemDto;
import org.example.filesharing.entities.dtos.admin.AdminSettingUpdateRequestDto;
import org.example.filesharing.services.AdminSettingService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// cong phia quan tri (khong ROLE_USER) o SecurityConfig, tung hanh dong do @PreAuthorize theo AdminPermission
@RestController
@RequestMapping("api/admin/settings")
@RequiredArgsConstructor
public class AdminSettingController {

    private final AdminSettingService adminSettingService;
    private final AdminEmailTemplateService adminEmailTemplateService;

    // kiem tra SMTP theo setting MAIL hien hanh (CONNECT hoac SEND), loi SMTP tra ok=false chu khong nem
    @PostMapping("mail/test")
    @PreAuthorize("hasAuthority('Admin.Setting.TestMail')")
    public CommonResponse<AdminMailTestResultDto> testMail(@RequestBody AdminMailTestRequestDto request) {
        return CommonResponse.success(adminEmailTemplateService.testMail(request));
    }

    @GetMapping("")
    @PreAuthorize("hasAuthority('Admin.Setting.GetPaged')")
    public CommonResponse<List<AdminSettingGroupDto>> getAll() {
        return CommonResponse.success(adminSettingService.getAll());
    }

    @PutMapping("{group}")
    @PreAuthorize("hasAuthority('Admin.Setting.Update')")
    public CommonResponse<List<AdminSettingItemDto>> updateGroup(
            @PathVariable("group") String group,
            @RequestBody AdminSettingUpdateRequestDto request,
            @RequestHeader(value = "Origin", required = false) String origin) {
        return CommonResponse.success(adminSettingService.updateGroup(group, request, origin));
    }

    @PostMapping("{key}/reset")
    @PreAuthorize("hasAuthority('Admin.Setting.Update')")
    public CommonResponse<AdminSettingItemDto> reset(
            @PathVariable("key") String key,
            @RequestHeader(value = "Origin", required = false) String origin) {
        return CommonResponse.success(adminSettingService.reset(key, origin));
    }
}
