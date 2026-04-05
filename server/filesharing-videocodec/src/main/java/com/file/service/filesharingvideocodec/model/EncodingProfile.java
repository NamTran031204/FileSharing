package com.file.service.filesharingvideocodec.model;

import lombok.Getter;

@Getter
public enum EncodingProfile {
    ORIGINAL("original", null, "5000k", "original"),
    PROFILE_720P("720p", "1280x720", "2000k", "720p");

    private final String name;
    private final String resolution;
    private final String videoBitrate;
    private final String suffix;

    EncodingProfile(String name, String resolution, String videoBitrate, String suffix) {
        this.name = name;
        this.resolution = resolution;
        this.videoBitrate = videoBitrate;
        this.suffix = suffix;
    }

    public boolean hasResolutionScale() {
        return resolution != null;
    }
}
