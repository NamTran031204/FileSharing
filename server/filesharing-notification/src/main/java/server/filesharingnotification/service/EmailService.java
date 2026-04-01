package server.filesharingnotification.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import server.filesharingnotification.entity.dto.EmailSenderRequestDto;

import java.time.Duration;
import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromMail;

    public void sendDownloadLinkViaEmail(EmailSenderRequestDto input) throws MessagingException {
        Instant startTime = Instant.now();
        log.info("Starting to send email to: {}, fileName: {}", input.getToEmail(), input.getObjectName());
        
        try {
            String subject = "A File Send To Your Email";

            Context context = new Context();
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
}
