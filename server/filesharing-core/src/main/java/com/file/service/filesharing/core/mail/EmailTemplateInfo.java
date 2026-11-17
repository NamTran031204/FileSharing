package com.file.service.filesharing.core.mail;

import java.util.List;

/** Thong tin mot ma template (catalogue). Nguon duy nhat la EmailTemplateCode; noi dung subject/html luu rieng. */
public record EmailTemplateInfo(String code, String name, String description, List<String> variables) {
}
