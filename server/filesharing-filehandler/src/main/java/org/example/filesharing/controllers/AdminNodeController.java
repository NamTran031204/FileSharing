package org.example.filesharing.controllers;

import com.file.service.filesharing.core.entity.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.admin.AdminNodeDrainRequestDto;
import org.example.filesharing.entities.dtos.admin.AdminNodeDto;
import org.example.filesharing.services.AdminNodeService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// cong phia quan tri (khong ROLE_USER) o SecurityConfig, tung hanh dong do @PreAuthorize theo AdminPermission
@RestController
@RequestMapping("api/admin/nodes")
@RequiredArgsConstructor
public class AdminNodeController {

    private final AdminNodeService adminNodeService;

    @GetMapping("")
    @PreAuthorize("hasAuthority('Admin.Node.GetPaged')")
    public CommonResponse<List<AdminNodeDto>> getAll() {
        return CommonResponse.success(adminNodeService.getAll());
    }

    @PostMapping("{nodeId}/drain")
    @PreAuthorize("hasAuthority('Admin.Node.Drain')")
    public CommonResponse<AdminNodeDto> drain(@PathVariable("nodeId") String nodeId,
                                              @RequestBody AdminNodeDrainRequestDto request) {
        return CommonResponse.success(adminNodeService.setDraining(nodeId, request.isDraining()));
    }
}
