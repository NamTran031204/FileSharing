package com.file.service.filesharing.core.mail;

import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class EmailTemplateRendererTest {

    private static final EmailTemplateCode C = EmailTemplateCode.FILE_SENDER;

    private static Map<String, String> vars() {
        Map<String, String> m = new HashMap<>();
        m.put("senderEmail", "a@b.c");
        m.put("fileName", "f.pdf");
        m.put("downloadLink", "http://x/y");
        return m;
    }

    private static void assertInvalid(Runnable r) {
        FileBusinessException e = assertThrows(FileBusinessException.class, r::run);
        assertEquals(ErrorCode.EMAIL_TEMPLATE_INVALID, e.getErrorCode());
    }

    @Test
    void scriptValueBecomesText() {
        Map<String, String> v = vars();
        v.put("fileName", "<script>alert(1)</script>");
        var r = EmailTemplateRenderer.render(C, "s", "<b>{{fileName}}</b>", v);
        assertEquals("<b>&lt;script&gt;alert(1)&lt;/script&gt;</b>", r.body());
    }

    @Test
    void unknownVariableFails() {
        assertInvalid(() -> EmailTemplateRenderer.render(C, "s", "{{abc}}", vars()));
        assertInvalid(() -> EmailTemplateRenderer.validate(C, "s", "{{fileName}} {{"));
    }

    @Test
    void missingRequiredVariableFails() {
        Map<String, String> v = vars();
        v.remove("downloadLink");
        assertInvalid(() -> EmailTemplateRenderer.render(C, "s", "b", v));
    }

    @Test
    void subjectDropsCrLf() {
        Map<String, String> v = vars();
        v.put("fileName", "x\r\nBcc: evil@e.com");
        var r = EmailTemplateRenderer.render(C, "Hi {{fileName}}\r\nBcc: z", "b", v);
        assertFalse(r.subject().contains("\r"));
        assertFalse(r.subject().contains("\n"));
    }

    @Test
    void limitsEnforced() {
        assertInvalid(() -> EmailTemplateRenderer.render(C, "s".repeat(201), "b", vars()));
        assertInvalid(() -> EmailTemplateRenderer.render(C, "s", "b".repeat(200 * 1024 + 1), vars()));
    }

    @Test
    void valueNotReExpanded() {
        Map<String, String> v = vars();
        v.put("fileName", "{{downloadLink}}$1");
        var r = EmailTemplateRenderer.render(C, "s", "{{fileName}}", v);
        assertEquals("{{downloadLink}}$1", r.body());
    }

    @Test
    void defaultsAreValid() {
        for (EmailTemplateCode code : EmailTemplateCode.values()) {
            for (String loc : new String[]{"vi", "en"}) {
                var t = EmailTemplateStore.defaultOf(code, loc);
                EmailTemplateRenderer.validate(code, t.subject(), t.body());
            }
        }
    }
}
