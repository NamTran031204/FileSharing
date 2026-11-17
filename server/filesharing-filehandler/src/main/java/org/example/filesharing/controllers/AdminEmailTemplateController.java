package org.example.filesharing.controllers;

import com.file.service.filesharing.core.entity.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.admin.*;
import org.example.filesharing.services.AdminEmailTemplateService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// cong ROLE_SA da chan o SecurityConfig cho moi duong dan /api/admin
@RestController
@RequestMapping("api/admin/email-templates")
@RequiredArgsConstructor
public class AdminEmailTemplateController {

    private final AdminEmailTemplateService service;

    @GetMapping("")
    public CommonResponse<List<AdminEmailTemplateRowDto>> list() {
        return CommonResponse.success(service.list());
    }

    @GetMapping("{code}/{locale}")
    public CommonResponse<AdminEmailTemplateDto> get(@PathVariable("code") String code, @PathVariable("locale") String locale) {
        return CommonResponse.success(service.get(code, locale));
    }

    @PutMapping("{code}/{locale}")
    public CommonResponse<AdminEmailTemplateDto> update(@PathVariable("code") String code, @PathVariable("locale") String locale,
                                                        @RequestBody AdminEmailTemplateUpdateDto request) {
        return CommonResponse.success(service.update(code, locale, request));
    }

    @PostMapping("{code}/{locale}/reset")
    public CommonResponse<AdminEmailTemplateDto> reset(@PathVariable("code") String code, @PathVariable("locale") String locale) {
        return CommonResponse.success(service.reset(code, locale));
    }

    @PostMapping("preview")
    public CommonResponse<AdminEmailPreviewDto> preview(@RequestBody AdminEmailPreviewRequestDto request) {
        return CommonResponse.success(service.preview(request));
    }

    @PostMapping("{code}/{locale}/send-test")
    public CommonResponse<Boolean> sendTest(@PathVariable("code") String code, @PathVariable("locale") String locale,
                                            @RequestBody AdminMailTestRequestDto request) {
        service.sendTest(code, locale, request == null ? null : request.getToEmail());
        return CommonResponse.success(true);
    }
}
