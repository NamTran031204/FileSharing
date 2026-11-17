package com.file.service.filesharing.core.mail;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class EmailTemplateCodeTest {

    @Test
    void catalogueCoTatCaMaVaDayDuThongTin() {
        assertEquals(EmailTemplateCode.values().length, EmailTemplateCode.catalogue().size());
        for (EmailTemplateInfo i : EmailTemplateCode.catalogue()) {
            assertFalse(i.name().isBlank(), i.code());
            assertFalse(i.description().isBlank(), i.code());
            assertFalse(i.variables().isEmpty(), i.code());
            assertEquals(EmailTemplateCode.valueOf(i.code()).variables().size(), i.variables().size());
        }
    }
}
