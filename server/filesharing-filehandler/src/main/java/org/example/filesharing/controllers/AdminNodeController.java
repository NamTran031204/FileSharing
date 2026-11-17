package org.example.filesharing.controllers;

import com.file.service.filesharing.core.entity.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.admin.AdminNodeDrainRequestDto;
import org.example.filesharing.entities.dtos.admin.AdminNodeDto;
import org.example.filesharing.services.AdminNodeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// cong ROLE_SA da chan o SecurityConfig cho moi duong dan /api/admin
@RestController
@RequestMapping("api/admin/nodes")
@RequiredArgsConstructor
public class AdminNodeController {

    private final AdminNodeService adminNodeService;

    @GetMapping("")
    public CommonResponse<List<AdminNodeDto>> getAll() {
        return CommonResponse.success(adminNodeService.getAll());
    }

    @PostMapping("{nodeId}/drain")
    public CommonResponse<AdminNodeDto> drain(@PathVariable("nodeId") String nodeId,
                                              @RequestBody AdminNodeDrainRequestDto request) {
        return CommonResponse.success(adminNodeService.setDraining(nodeId, request.isDraining()));
    }
}
