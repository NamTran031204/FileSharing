package com.file.service.filesharing.core.mail;

import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Render template cu phap {{bien}}. Chi thay the 1 luot (gia tri khong bi expand lai), gia tri vao body
 * bi HTML-escape, subject bo CR/LF chong header injection. Khong Thymeleaf/SpEL.
 */
public final class EmailTemplateRenderer {

    public static final int MAX_SUBJECT_CHARS = 200;
    public static final int MAX_BODY_BYTES = 200 * 1024;

    private static final Pattern VAR = Pattern.compile("\\{\\{\\s*([A-Za-z][A-Za-z0-9_]*)\\s*}}");

    public record Rendered(String subject, String body) {
    }

    private EmailTemplateRenderer() {
    }

    /** kiem tra template luc luu: rong, do dai, bien la, cu phap {{ hong */
    public static void validate(EmailTemplateCode code, String subject, String body) {
        if (subject == null || subject.isBlank() || body == null || body.isBlank()) throw invalid("empty");
        if (subject.length() > MAX_SUBJECT_CHARS) throw invalid("subject too long");
        if (body.getBytes(StandardCharsets.UTF_8).length > MAX_BODY_BYTES) throw invalid("body too large");
        checkTemplate(code, subject);
        checkTemplate(code, body);
    }

    public static Rendered render(EmailTemplateCode code, String subject, String body, Map<String, String> vars) {
        validate(code, subject, body);
        for (String required : code.variables()) {
            String v = vars == null ? null : vars.get(required);
            if (v == null || v.isBlank()) throw invalid("missing variable " + required);
        }
        String s = substitute(subject, vars, false).replace("\r", "").replace("\n", "");
        String b = substitute(body, vars, true);
        if (s.length() > MAX_SUBJECT_CHARS) throw invalid("subject too long");
        if (b.getBytes(StandardCharsets.UTF_8).length > MAX_BODY_BYTES) throw invalid("body too large");
        return new Rendered(s, b);
    }

    private static void checkTemplate(EmailTemplateCode code, String tpl) {
        Matcher m = VAR.matcher(tpl);
        while (m.find()) {
            if (!code.variables().contains(m.group(1))) throw invalid("unknown variable " + m.group(1));
        }
        // sau khi bo cac bien hop le ma con {{ hoac }} thi cu phap hong
        String rest = VAR.matcher(tpl).replaceAll("");
        if (rest.contains("{{") || rest.contains("}}")) throw invalid("malformed placeholder");
    }

    private static String substitute(String tpl, Map<String, String> vars, boolean escape) {
        Matcher m = VAR.matcher(tpl);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            String v = vars.get(m.group(1));
            m.appendReplacement(sb, Matcher.quoteReplacement(escape ? escapeHtml(v) : v));
        }
        m.appendTail(sb);
        return sb.toString();
    }

    static String escapeHtml(String s) {
        StringBuilder sb = new StringBuilder(s.length() + 16);
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '&' -> sb.append("&amp;");
                case '<' -> sb.append("&lt;");
                case '>' -> sb.append("&gt;");
                case '"' -> sb.append("&quot;");
                case '\'' -> sb.append("&#39;");
                default -> sb.append(c);
            }
        }
        return sb.toString();
    }

    // message ngan, khong chua gia tri nguoi dung
    private static FileBusinessException invalid(String reason) {
        return new FileBusinessException(ErrorCode.EMAIL_TEMPLATE_INVALID, reason);
    }
}
