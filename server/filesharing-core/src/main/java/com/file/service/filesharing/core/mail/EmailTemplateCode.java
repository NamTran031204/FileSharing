package com.file.service.filesharing.core.mail;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

/**
 * Catalogue ma template: ma + ten + mo ta + tap bien cho phep (cung la tap bien bat buoc khi render).
 * Them mot ma moi = them mot hang so o day (va mau mac dinh trong EmailTemplateDefaults).
 */
public enum EmailTemplateCode {
    FILE_SENDER("Chia sẻ file", "Gửi cho người nhận khi có file được chia sẻ qua email",
            Set.of("senderEmail", "fileName", "downloadLink")),
    GOOGLE_ACCOUNT_LINKED("Liên kết tài khoản Google", "Cảnh báo bảo mật khi một tài khoản Google vừa được liên kết",
            Set.of("toEmail"));

    private final String displayName;
    private final String description;
    private final Set<String> variables;

    EmailTemplateCode(String displayName, String description, Set<String> variables) {
        this.displayName = displayName;
        this.description = description;
        this.variables = variables;
    }

    public Set<String> variables() {
        return variables;
    }

    public EmailTemplateInfo info() {
        return new EmailTemplateInfo(name(), displayName, description, variables.stream().sorted().toList());
    }

    public static List<EmailTemplateInfo> catalogue() {
        return Arrays.stream(values()).map(EmailTemplateCode::info).toList();
    }
}
