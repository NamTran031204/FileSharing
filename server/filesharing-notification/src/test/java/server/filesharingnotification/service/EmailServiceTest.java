package server.filesharingnotification.service;

import com.file.service.filesharing.core.entity.models.EmailTemplateOverrideEntity;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import com.file.service.filesharing.core.mail.EmailTemplateStore;
import com.file.service.filesharing.core.mail.MailSenderFactory;
import com.file.service.filesharing.core.setting.RuntimeSettings;
import com.file.service.filesharing.core.setting.SettingKey;
import jakarta.mail.BodyPart;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import server.filesharingnotification.entity.dto.EmailSenderRequestDto;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EmailServiceTest {

    MongoTemplate mongo = mock(MongoTemplate.class);
    RuntimeSettings settings = mock(RuntimeSettings.class);
    MailSenderFactory factory = mock(MailSenderFactory.class);
    JavaMailSenderImpl sender = spy(new JavaMailSenderImpl());
    // kho gia lap collection email_templates
    List<EmailTemplateOverrideEntity> db = new ArrayList<>();
    EmailTemplateStore store;
    EmailService service;

    @BeforeEach
    void setUp() {
        doNothing().when(sender).send(any(MimeMessage.class));
        when(factory.create()).thenReturn(sender);
        when(factory.fromAddress()).thenReturn("noreply@example.com");
        when(factory.fromName()).thenReturn("File Sharing Service");
        when(settings.string(SettingKey.APP_FRONTEND_BASE_URL)).thenReturn("https://app.example.com/");
        when(mongo.findAll(EmailTemplateOverrideEntity.class)).thenAnswer(i -> new ArrayList<>(db));
        store = new EmailTemplateStore(mongo, Duration.ofSeconds(10));
        service = new EmailService(factory, store, settings);
    }

    EmailSenderRequestDto dto(String locale, String fileName) {
        EmailSenderRequestDto d = new EmailSenderRequestDto();
        d.setFromUser("alice@example.com");
        d.setToEmail("bob@example.com");
        d.setObjectName(fileName);
        d.setShareToken("tok123");
        d.setLocale(locale);
        return d;
    }

    MimeMessage sent() {
        ArgumentCaptor<MimeMessage> c = ArgumentCaptor.forClass(MimeMessage.class);
        verify(sender).send(c.capture());
        return c.getValue();
    }

    static String text(Part p) throws Exception {
        if (p.getContent() instanceof Multipart mp) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < mp.getCount(); i++) {
                BodyPart bp = mp.getBodyPart(i);
                sb.append(text(bp));
            }
            return sb.toString();
        }
        return String.valueOf(p.getContent());
    }

    @Test
    void macDinhVi_noiDungNhuCu_linkTheoBaseUrl() throws Exception {
        service.sendDownloadLinkViaEmail(dto(null, "bao-cao.pdf"));
        MimeMessage m = sent();
        assertEquals("Một file đã được chia sẻ với bạn", m.getSubject());
        String body = text(m);
        assertTrue(body.contains("https://app.example.com/preview/tok123"), body);
        assertTrue(body.contains("alice@example.com") && body.contains("bao-cao.pdf"));
        assertTrue(body.contains("Tải file ngay"));
        assertFalse(body.contains("localhost:5173"));
        assertEquals("noreply@example.com", ((InternetAddress) m.getFrom()[0]).getAddress());
    }

    @Test
    void macDinhEn() throws Exception {
        service.sendDownloadLinkViaEmail(dto("en", "a.pdf"));
        MimeMessage m = sent();
        assertEquals("A file has been shared with you", m.getSubject());
        assertTrue(text(m).contains("Download File Now"));
    }

    @Test
    void googleLinked_en() throws Exception {
        service.sendGoogleAccountLinkedEmail(dto("en", null));
        MimeMessage m = sent();
        assertEquals("Warning: A Google account was just linked", m.getSubject());
        assertTrue(text(m).contains("bob@example.com"));
    }

    @Test
    void doiSubject_emailKeTiepDungSubjectMoi() throws Exception {
        service.sendDownloadLinkViaEmail(dto("vi", "a.pdf"));
        db.add(EmailTemplateOverrideEntity.builder().id("FILE_SENDER:vi").subject("Tieu de moi {{fileName}}")
                .body("<p>{{senderEmail}} {{downloadLink}} {{fileName}}</p>").build());
        store.invalidate();
        service.sendDownloadLinkViaEmail(dto("vi", "b.pdf"));
        ArgumentCaptor<MimeMessage> c = ArgumentCaptor.forClass(MimeMessage.class);
        verify(sender, times(2)).send(c.capture());
        assertEquals("Tieu de moi b.pdf", c.getAllValues().get(1).getSubject());
    }

    @Test
    void giaTriDuocEscape() throws Exception {
        service.sendDownloadLinkViaEmail(dto("vi", "<script>alert(1)</script>"));
        String body = text(sent());
        assertFalse(body.contains("<script>alert"));
        assertTrue(body.contains("&lt;script&gt;alert(1)&lt;/script&gt;"));
    }

    @Test
    void subjectBoCrlf() throws Exception {
        db.add(EmailTemplateOverrideEntity.builder().id("FILE_SENDER:vi").subject("Gui {{fileName}}")
                .body("<p>{{senderEmail}} {{downloadLink}} {{fileName}}</p>").build());
        service.sendDownloadLinkViaEmail(dto("vi", "a\r\nBcc: evil@example.com"));
        String subject = sent().getSubject();
        assertFalse(subject.contains("\r") || subject.contains("\n"), subject);
    }

    @Test
    void loiCipher_lanRaChoConsumer() {
        when(factory.create()).thenThrow(new FileBusinessException(ErrorCode.SETTING_CIPHER_FAILED));
        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> service.sendDownloadLinkViaEmail(dto("vi", "a.pdf")));
        assertEquals(ErrorCode.SETTING_CIPHER_FAILED, e.getErrorCode());
        verifyNoInteractions(sender);
    }
}
