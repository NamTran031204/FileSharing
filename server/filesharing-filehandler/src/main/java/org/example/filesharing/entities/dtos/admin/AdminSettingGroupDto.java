package org.example.filesharing.entities.dtos.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminSettingGroupDto {
    private String group;
    // true = thong so loi cua dev (core), admin chi xem
    private boolean readOnly;
    private List<AdminSettingItemDto> items;
}
