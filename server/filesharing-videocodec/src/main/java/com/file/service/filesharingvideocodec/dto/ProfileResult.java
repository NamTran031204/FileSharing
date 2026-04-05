package com.file.service.filesharingvideocodec.dto;

import com.file.service.filesharingvideocodec.model.EncodingProfile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResult {
    private EncodingProfile profile;
    private String m3u8Url;
    private List<String> tsFileUrls;
    private Long durationMs;
    private String status;
    private String error;
}
