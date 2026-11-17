package server.filesharingnotification.service;

import com.file.service.filesharing.core.mail.EmailTemplateCode;
import com.file.service.filesharing.core.mail.EmailTemplateRenderer;
import com.file.service.filesharing.core.mail.EmailTemplateStore;
import com.file.service.filesharing.core.mail.MailSenderFactory;
import com.file.service.filesharing.core.setting.RuntimeSettings;
import com.file.service.filesharing.core.setting.SettingKey;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import server.filesharingnotification.entity.dto.EmailSenderRequestDto;

import java.io.UnsupportedEncodingException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;

/**
 * Gui email bang SMTP va template lay tu setting/DB (khong con Thymeleaf, khong hardcode link).
 * Hien tai: 2 loai thu (link tai file, canh bao lien ket Google). Sau nay them loai moi chi can them
 * EmailTemplateCode va 1 ham send tuong ung.
 * Loi cipher (SETTING_CIPHER_FAILED) tu RuntimeSettings.secret duoc de lan ra EmailConsumer xu ly.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {
    private final MailSenderFactory mailSenderFactory;
    private final EmailTemplateStore templateStore;
    private final RuntimeSettings settings;

    public void sendDownloadLinkViaEmail(EmailSenderRequestDto input) throws MessagingException {
        Instant startTime = Instant.now();
        log.info("Starting to send email to: {}, fileName: {}", input.getToEmail(), input.getObjectName());
        // link luon theo app.frontend-base-url, bo dau / cuoi de khong thanh //preview
        String link = settings.string(SettingKey.APP_FRONTEND_BASE_URL).replaceAll("/+$", "")
                + "/preview/" + input.getShareToken();
        Map<String, String> vars = Map.of(
                "senderEmail", nz(input.getFromUser()),
                "fileName", nz(input.getObjectName()),
                "downloadLink", link);
        send(EmailTemplateCode.FILE_SENDER, input, vars, startTime);
    }

    public void sendGoogleAccountLinkedEmail(EmailSenderRequestDto input) throws MessagingException {
        Instant startTime = Instant.now();
        log.info("Starting to send google-linked warning email to: {}", input.getToEmail());
        send(EmailTemplateCode.GOOGLE_ACCOUNT_LINKED, input, Map.of("toEmail", nz(input.getToEmail())), startTime);
    }

    private void send(EmailTemplateCode code, EmailSenderRequestDto input, Map<String, String> vars, Instant startTime)
            throws MessagingException {
        try {
            EmailTemplateStore.Template t = templateStore.get(code, input.getLocale());
            EmailTemplateRenderer.Rendered r = EmailTemplateRenderer.render(code, t.subject(), t.body(), vars);

            JavaMailSenderImpl mailSender = mailSenderFactory.create();
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            String from = mailSenderFactory.fromAddress();
            if (!from.isBlank()) helper.setFrom(new InternetAddress(from, mailSenderFactory.fromName(), "UTF-8"));
            helper.setTo(input.getToEmail());
            helper.setSubject(r.subject());
            helper.setText(r.body(), true);
            mailSender.send(mimeMessage);

            log.info("Email {} sent to {} in {} ms", code, input.getToEmail(),
                    Duration.between(startTime, Instant.now()).toMillis());
        } catch (UnsupportedEncodingException e) {
            throw new MessagingException("invalid from address");
        } catch (MessagingException e) {
            log.error("Failed to send email {} to {} after {} ms: {}", code, input.getToEmail(),
                    Duration.between(startTime, Instant.now()).toMillis(), e.getMessage());
            throw e;
        }
    }

    // gia tri null thi thay bang "-" de van render duoc (truoc day Thymeleaf render rong)
    private static String nz(String s) {
        return s == null || s.isBlank() ? "-" : s;
    }
}
