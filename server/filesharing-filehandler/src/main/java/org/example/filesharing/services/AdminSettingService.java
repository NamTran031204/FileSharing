package org.example.filesharing.services;

import org.example.filesharing.entities.dtos.admin.AdminSettingGroupDto;
import org.example.filesharing.entities.dtos.admin.AdminSettingItemDto;
import org.example.filesharing.entities.dtos.admin.AdminSettingUpdateRequestDto;

import java.util.List;

public interface AdminSettingService {

    List<AdminSettingGroupDto> getAll();

    /** requestOrigin: header Origin cua chinh request, dung cho guard CORS */
    List<AdminSettingItemDto> updateGroup(String group, AdminSettingUpdateRequestDto request, String requestOrigin);

    AdminSettingItemDto reset(String key, String requestOrigin);
}
