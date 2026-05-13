package org.example.filesharing.enums;

import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.exceptions.specException.FileBusinessException;

public enum MediaType {
    IMAGE, VIDEO, DESIGN;

    public static MediaType fromMime(String mime) {
        if (mime == null || mime.trim().isEmpty()) {
            throw new FileBusinessException(ErrorCode.FILE_ERROR, "Đuôi file không được để trống");
        }

        String ext = mime.toLowerCase();

        // todo: bo sung duoi type ho tro
        return switch (ext) {
            case ".jpg", ".jpeg", ".png", ".gif", ".webp" -> IMAGE;
            case ".mp4", ".mov", ".avi", ".mkv"           -> VIDEO;
            case ".psd", ".ai", ".fig", ".sketch"         -> DESIGN;
            default -> throw new FileBusinessException(ErrorCode.FILE_ERROR, "Không hỗ trợ định dạng file: " + mime);
        };
    }
}
