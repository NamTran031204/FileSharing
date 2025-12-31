package org.example.filesharing.services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.file.EmailSenderRequestDto;
import org.example.filesharing.entities.models.MetadataEntity;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.exceptions.specException.FileBusinessException;
import org.example.filesharing.repositories.MetadataRepo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;
    private final MetadataRepo metadataRepo;
    private final TemplateEngine templateEngine;
    private final AuditService auditService;

    @Value("${spring.mail.username}")
    private String fromMail;

    public void sendDownloadLinkViaEmail(EmailSenderRequestDto input) throws MessagingException {

        MetadataEntity metadata = metadataRepo.findByObjectName(input.getObjectName())
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));

        String subject = "A File Send To Your Email";

        Context context = new Context();
        context.setVariable("senderEmail", auditService.getCurrentUserEmail());
        context.setVariable("fileName", input.getObjectName());
        context.setVariable("downloadLink", metadata.getFileName());

        String htmlBody = templateEngine.process("email/fileSender", context);

        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

        helper.setFrom(fromMail);
        helper.setTo(input.getToEmail());
        helper.setSubject(subject);
        helper.setText(htmlBody, true);

        mailSender.send(mimeMessage);
    }
}
