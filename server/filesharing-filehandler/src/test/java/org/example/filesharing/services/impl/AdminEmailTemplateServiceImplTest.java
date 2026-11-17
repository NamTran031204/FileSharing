package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.AuditLogEntity;
import com.file.service.filesharing.core.entity.models.EmailTemplateOverrideEntity;
import com.file.service.filesharing.core.enums.AuditAction;
import com.file.service.filesharing.core.enums.AuditActorType;
import com.file.service.filesharing.core.enums.AuditTargetType;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import com.file.service.filesharing.core.mail.EmailTemplateCode;
import com.file.service.filesharing.core.mail.EmailTemplateStore;
import com.file.service.filesharing.core.mail.MailSenderFactory;
import com.file.service.filesharing.core.setting.RuntimeSettings;
import com.file.service.filesharing.core.setting.SettingKey;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.example.filesharing.entities.dtos.admin.*;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.repositories.AuditLogRepo;
import org.example.filesharing.services.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class AdminEmailTemplateServiceImplTest {

    MongoTemplate mongo = mock(MongoTemplate.class);
    RuntimeSettings settings = mock(RuntimeSettings.class);
    MailSenderFactory factory = mock(MailSenderFactory.class);
    AuditService auditService = mock(AuditService.class);
    AuditLogRepo auditLogRepo = mock(AuditLogRepo.class);
    JavaMailSenderImpl sender = spy(new JavaMailSenderImpl());
    // kho gia lap collection email_templates
    Map<String, EmailTemplateOverrideEntity> db = new HashMap<>();
    EmailTemplateStore store;
    AdminEmailTemplateServiceImpl service;

    @BeforeEach
    void setUp() {
        when(mongo.findAll(EmailTemplateOverrideEntity.class)).thenAnswer(i -> new ArrayList<>(db.values()));
        when(mongo.save(any(EmailTemplateOverrideEntity.class))).thenAnswer(i -> {
            EmailTemplateOverrideEntity e = i.getArgument(0);
            db.put(e.getId(), e);
            return e;
        });
        when(mongo.findById(anyString(), eq(EmailTemplateOverrideEntity.class))).thenAnswer(i -> db.get(i.<String>getArgument(0)));
        when(mongo.remove(any(Query.class), eq(EmailTemplateOverrideEntity.class))).thenAnswer(i -> {
            db.remove(String.valueOf(((Query) i.getArgument(0)).getQueryObject().get("_id")));
            return null;
        });
        UserEntity sa = UserEntity.builder().userId("sa1").email("sa@example.com").build();
        when(auditService.getCurrentUser()).thenReturn(sa);
        when(settings.string(SettingKey.APP_FRONTEND_BASE_URL)).thenReturn("https://app.example.com/");
        when(factory.create()).thenReturn(sender);
        when(factory.fromAddress()).thenReturn("noreply@example.com");
        when(factory.fromName()).thenReturn("FS");
        doNothing().when(sender).send(any(MimeMessage.class));
        store = new EmailTemplateStore(mongo, Duration.ofMinutes(10));
        service = new AdminEmailTemplateServiceImpl(mongo, store, factory, settings, auditService, auditLogRepo);
    }

    static AdminEmailTemplateUpdateDto upd(String s, String b) {
        return new AdminEmailTemplateUpdateDto(s, b);
    }

    @Test
    void macDinh_khongOverride_cua4Mau() {
        List<AdminEmailTemplateRowDto> rows = service.list();
        assertEquals(EmailTemplateCode.values().length, rows.size());
        assertEquals(EmailTemplateCode.catalogue().size(), rows.size());
        for (AdminEmailTemplateRowDto r : rows) {
            assertFalse(r.getName().isBlank());
            assertFalse(r.getDescription().isBlank());
            assertEquals(List.of("vi", "en"), r.getLocales().stream().map(AdminEmailTemplateRowDto.LocaleState::getLocale).toList());
        }
        AdminEmailTemplateDto d = service.get("FILE_SENDER", "vi");
        assertFalse(d.isOverridden());
        assertEquals("Một file đã được chia sẻ với bạn", d.getSubject());
        assertTrue(d.getVariables().contains("downloadLink"));
    }

    @Test
    void luuHopLe_cacheDoiNgayVaAudit() {
        service.get("FILE_SENDER", "vi"); // nap cache
        AdminEmailTemplateDto d = service.update("file_sender", "vi", upd("Moi {{fileName}}", "<p>{{senderEmail}} {{fileName}} {{downloadLink}}</p>"));
        assertTrue(d.isOverridden());
        assertEquals("Moi {{fileName}}", store.get(com.file.service.filesharing.core.mail.EmailTemplateCode.FILE_SENDER, "vi").subject());
        ArgumentCaptor<AuditLogEntity> c = ArgumentCaptor.forClass(AuditLogEntity.class);
        verify(auditLogRepo).save(c.capture());
        AuditLogEntity a = c.getValue();
        assertEquals(AuditAction.TEMPLATE_UPDATED, a.getAction());
        assertEquals(AuditActorType.ADMIN, a.getActorType());
        assertEquals(AuditTargetType.EMAIL_TEMPLATE, a.getTargetType());
        assertNull(a.getProjectId());
    }

    @Test
    void templateSai_emailTemplateInvalid_khongLuu() {
        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.update("FILE_SENDER", "vi", upd("x {{abc}}", "<p>{{downloadLink}}</p>")));
        assertEquals(ErrorCode.EMAIL_TEMPLATE_INVALID, e.getErrorCode());
        e = assertThrows(FileBusinessException.class,
                () -> service.update("FILE_SENDER", "vi", upd("x", "<p>thieu bien</p>".replace("thieu", "{{{{x"))));
        assertEquals(ErrorCode.EMAIL_TEMPLATE_INVALID, e.getErrorCode());
        assertTrue(db.isEmpty());
        verifyNoInteractions(auditLogRepo);
    }

    @Test
    void maLaHoacLocaleLa_invalid() {
        assertEquals(ErrorCode.EMAIL_TEMPLATE_INVALID,
                assertThrows(FileBusinessException.class, () -> service.get("NOPE", "vi")).getErrorCode());
        assertEquals(ErrorCode.EMAIL_TEMPLATE_INVALID,
                assertThrows(FileBusinessException.class, () -> service.get("FILE_SENDER", "fr")).getErrorCode());
    }

    @Test
    void reset_xoaOverrideVaAudit() {
        service.update("FILE_SENDER", "en", upd("S", "<p>{{senderEmail}} {{fileName}} {{downloadLink}}</p>"));
        AdminEmailTemplateDto d = service.reset("FILE_SENDER", "en");
        assertFalse(d.isOverridden());
        assertEquals("A file has been shared with you", d.getSubject());
        assertTrue(db.isEmpty());
        ArgumentCaptor<AuditLogEntity> c = ArgumentCaptor.forClass(AuditLogEntity.class);
        verify(auditLogRepo, times(2)).save(c.capture());
        assertEquals(AuditAction.TEMPLATE_RESET, c.getAllValues().get(1).getAction());
    }

    @Test
    void preview_crlfVaGiaTriMau() {
        AdminEmailPreviewDto p = service.preview(new AdminEmailPreviewRequestDto("FILE_SENDER", "Gui\r\n{{fileName}}",
                "<script>x</script>{{senderEmail}} {{fileName}} {{downloadLink}}"));
        assertFalse(p.getSubject().contains("\n") || p.getSubject().contains("\r"));
        assertTrue(p.getBody().contains("https://app.example.com/preview/sample-token"));
    }

    @Test
    void preview_bienLa_invalid() {
        assertThrows(FileBusinessException.class, () -> service.preview(
                new AdminEmailPreviewRequestDto("GOOGLE_ACCOUNT_LINKED", "s", "{{toEmail}} {{abc}}")));
    }

    @Test
    void sendTest_guiMauDaLuu() throws Exception {
        service.sendTest("FILE_SENDER", "vi", "dest@example.com");
        ArgumentCaptor<MimeMessage> c = ArgumentCaptor.forClass(MimeMessage.class);
        verify(sender).send(c.capture());
        assertEquals("Một file đã được chia sẻ với bạn", c.getValue().getSubject());
    }

    @Test
    void sendTest_diaChiCrlf_biChan() {
        assertThrows(FileBusinessException.class, () -> service.sendTest("FILE_SENDER", "vi", "a@example.com\r\nBcc: x@example.com"));
        verifyNoInteractions(sender);
    }

    @Test
    void sendTest_loiSmtp_mailTestFailedKhongLoCredential() {
        doThrow(new org.springframework.mail.MailAuthenticationException("user=secretuser pass=hunter2"))
                .when(sender).send(any(MimeMessage.class));
        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.sendTest("FILE_SENDER", "vi", "dest@example.com"));
        assertEquals(ErrorCode.MAIL_TEST_FAILED, e.getErrorCode());
        assertFalse(String.valueOf(e.getMessage()).contains("hunter2"));
        assertNull(e.getCause());
    }

    @Test
    void mailTest_connectOk() throws Exception {
        JavaMailSenderImpl ok = mock(JavaMailSenderImpl.class);
        when(factory.create()).thenReturn(ok);
        AdminMailTestResultDto r = service.testMail(new AdminMailTestRequestDto("connect", null));
        assertTrue(r.isOk());
        assertNull(r.getError());
        assertTrue(r.getLatencyMs() >= 0);
    }

    @Test
    void mailTest_connectLoi_khongChuaCredential() throws Exception {
        JavaMailSenderImpl bad = mock(JavaMailSenderImpl.class);
        doThrow(new MessagingException("AUTH failed user=secretuser pass=hunter2 host=smtp.secret.host")).when(bad).testConnection();
        when(factory.create()).thenReturn(bad);
        AdminMailTestResultDto r = service.testMail(new AdminMailTestRequestDto("CONNECT", null));
        assertFalse(r.isOk());
        assertTrue(r.getError().startsWith("MAIL_TEST_FAILED"));
        assertFalse(r.getError().contains("hunter2") || r.getError().contains("secretuser") || r.getError().contains("secret.host"));
    }

    @Test
    void mailTest_loiCipher_chiTraMaLoi() {
        when(factory.create()).thenThrow(new FileBusinessException(ErrorCode.SETTING_CIPHER_FAILED));
        AdminMailTestResultDto r = service.testMail(new AdminMailTestRequestDto("SEND", null));
        assertFalse(r.isOk());
        assertEquals("SETTING_CIPHER_FAILED", r.getError());
    }

    @Test
    void mailTest_modeSai_invalid() {
        assertThrows(FileBusinessException.class, () -> service.testMail(new AdminMailTestRequestDto("X", null)));
    }
}
