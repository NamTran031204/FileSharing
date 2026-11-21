package org.example.filesharing.services;

import com.file.service.filesharing.core.entity.PageRequestDto;
import com.file.service.filesharing.core.entity.PageResult;
import org.example.filesharing.entities.dtos.admin.*;

public interface AdminUserService {
    PageResult<AdminUserRowDto> getPaged(PageRequestDto<AdminUserFilterDto> request);

    AdminUserDetailDto getDetail(String userId);

    AdminUserRowDto lock(String userId);

    AdminUserRowDto unlock(String userId);

    AdminUserRowDto updateAdminRoles(String userId, AdminAssignRolesDto request);

    AdminUserRowDto revokeSessions(String userId);

    AdminUserRowDto createOperatorAccount(AdminCreateUserRequestDto request);
}
