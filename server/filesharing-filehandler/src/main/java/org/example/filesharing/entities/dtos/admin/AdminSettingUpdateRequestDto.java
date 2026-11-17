package org.example.filesharing.entities.dtos.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

// values: key -> gia tri raw (secret de trong = giu nguyen); clear: key can xoa override (cach xoa secret)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminSettingUpdateRequestDto {
    private Map<String, String> values;
    private List<String> clear;
}
