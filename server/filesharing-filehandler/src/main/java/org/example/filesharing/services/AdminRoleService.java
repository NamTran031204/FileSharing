package org.example.filesharing.services;

import com.file.service.filesharing.core.entity.PageRequestDto;
import com.file.service.filesharing.core.entity.PageResult;
import org.example.filesharing.entities.dtos.admin.*;

import java.util.List;

public interface AdminRoleService {

    PageResult<AdminRoleRowDto> getPaged(PageRequestDto<AdminRoleFilterDto> request);

    AdminRoleDetailDto getDetail(String id);

    AdminRoleDetailDto create(AdminRoleUpsertDto request);

    AdminRoleDetailDto update(String id, AdminRoleUpsertDto request);

    void delete(String id);

    List<AdminPermissionGroupDto> permissionCatalogue();
}
