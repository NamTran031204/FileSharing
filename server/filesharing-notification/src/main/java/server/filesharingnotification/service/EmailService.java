package server.filesharingnotification.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import server.filesharingnotification.entity.dto.EmailSenderRequestDto;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final MessageSource messageSource;

    private static Locale resolveLocale(EmailSenderRequestDto input) {
        return "en".equalsIgnoreCase(input.getLocale()) ? Locale.ENGLISH : Locale.forLanguageTag("vi");
    }

    @Value("${spring.mail.username}")
    private String fromMail;

    public void sendDownloadLinkViaEmail(EmailSenderRequestDto input) throws MessagingException {
        Instant startTime = Instant.now();
        log.info("Starting to send email to: {}, fileName: {}", input.getToEmail(), input.getObjectName());

        try {
            Locale locale = resolveLocale(input);
            String subject = messageSource.getMessage("email.fileSender.subject", null, locale);

            Context context = new Context(locale);
            context.setVariable("senderEmail", input.getFromUser());
            context.setVariable("fileName", input.getObjectName());
            context.setVariable("downloadLink", "http://localhost:5173/preview/" + input.getShareToken());

            String htmlBody = templateEngine.process("email/fileSender", context);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromMail);
            helper.setTo(input.getToEmail());
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(mimeMessage);

            Duration duration = Duration.between(startTime, Instant.now());
            log.info("Email sent successfully to {} in {} ms", input.getToEmail(), duration.toMillis());
        } catch (MessagingException e) {
            Duration duration = Duration.between(startTime, Instant.now());
            log.error("Failed to send email to {} after {} ms: {}",
                    input.getToEmail(), duration.toMillis(), e.getMessage());
            throw e;
        }
    }

    public void sendGoogleAccountLinkedEmail(EmailSenderRequestDto input) throws MessagingException {
        Instant startTime = Instant.now();
        log.info("Starting to send google-linked warning email to: {}", input.getToEmail());

        try {
            Locale locale = resolveLocale(input);
            String subject = messageSource.getMessage("email.googleLinked.subject", null, locale);

            Context context = new Context(locale);
            context.setVariable("toEmail", input.getToEmail());

            String htmlBody = templateEngine.process("email/googleAccountLinked", context);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromMail);
            helper.setTo(input.getToEmail());
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(mimeMessage);

            Duration duration = Duration.between(startTime, Instant.now());
            log.info("Google-linked warning email sent to {} in {} ms", input.getToEmail(), duration.toMillis());
        } catch (MessagingException e) {
            Duration duration = Duration.between(startTime, Instant.now());
            log.error("Failed to send google-linked warning email to {} after {} ms: {}",
                    input.getToEmail(), duration.toMillis(), e.getMessage());
            throw e;
        }
    }
}
