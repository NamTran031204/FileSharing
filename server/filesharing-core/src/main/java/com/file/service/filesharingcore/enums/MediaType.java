package com.file.service.filesharingcore.enums;


import com.file.service.filesharingcore.exceptions.ErrorCode;
import com.file.service.filesharingcore.exceptions.specException.FileBusinessException;

public enum MediaType {
    IMAGE, VIDEO, DESIGN;

    public static MediaType fromMime(String mime) {
        if (mime == null || mime.trim().isEmpty()) {
            throw new FileBusinessException(ErrorCode.FILE_ERROR, "Đuôi file không được để trống");
        }

        String mimeLower = mime.toLowerCase();

        // todo: bo sung MIME type ho tro
        return switch (mimeLower) {
            case "image/jpeg", "image/png", "image/gif", "image/webp" -> IMAGE;

            // .mov - video/quicktime, .avi - video/x-msvideo, .mkv - video/x-matroska
            case "video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska" -> VIDEO;

            case "image/vnd.adobe.photoshop",           // .psd
                 "application/illustrator",             // .ai (hoặc application/postscript)
                 "application/postscript",              // .ai
                 "application/figma",                   // .fig
                 "application/vnd.sketchapp.document"   // .sketch
                    -> DESIGN;

            default -> throw new FileBusinessException(ErrorCode.FILE_ERROR, "Không hỗ trợ định dạng MIME: " + mime);
        };
    }
}
