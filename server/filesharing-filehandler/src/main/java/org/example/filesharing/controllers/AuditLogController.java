package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.auditlog.AuditLogItemDTO;
import org.example.filesharing.services.AuditLogService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping("/asset/{assetId}")
    public CommonResponse<PageResult<AuditLogItemDTO>> getAssetAuditLogs(
            @PathVariable("assetId") String assetId,
            @RequestParam(value = "versionNumber", required = false) Integer versionNumber,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size) {
        return CommonResponse.success(auditLogService.getAssetAuditLog(assetId, versionNumber, page, size));
    }
}
