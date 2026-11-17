package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.AuditLogEntity;
import com.file.service.filesharing.core.entity.models.EmailTemplateOverrideEntity;
import com.file.service.filesharing.core.entity.models.auditlog.AuditChanges;
import com.file.service.filesharing.core.enums.AuditAction;
import com.file.service.filesharing.core.enums.AuditActorType;
import com.file.service.filesharing.core.enums.AuditTargetType;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import com.file.service.filesharing.core.mail.EmailTemplateCode;
import com.file.service.filesharing.core.mail.EmailTemplateInfo;
import com.file.service.filesharing.core.mail.EmailTemplateRenderer;
import com.file.service.filesharing.core.mail.EmailTemplateStore;
import com.file.service.filesharing.core.mail.MailSenderFactory;
import com.file.service.filesharing.core.setting.RuntimeSettings;
import com.file.service.filesharing.core.setting.SettingKey;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.admin.*;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.repositories.AuditLogRepo;
import org.example.filesharing.services.AdminEmailTemplateService;
import org.example.filesharing.services.AuditService;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

/**
 * Quan ly mau email cho SA: xem, sua (override trong collection email_templates), reset, xem truoc, gui thu.
 * Moi thao tac chi dung gia tri mau, khong bao gio dung du lieu that cua nguoi dung. Sau khi luu/reset goi
 * EmailTemplateStore.invalidate() (process nay); notification doc lai theo TTL cache cua no.
 */
@Service
@RequiredArgsConstructor
public class AdminEmailTemplateServiceImpl implements AdminEmailTemplateService {

    private static final List<String> LOCALES = List.of("vi", "en");

    private final MongoTemplate mongoTemplate;
    private final EmailTemplateStore templateStore;
    private final MailSenderFactory mailSenderFactory;
    private final RuntimeSettings runtimeSettings;
    private final AuditService auditService;
    private final AuditLogRepo auditLogRepo;

    @Override
    public List<AdminEmailTemplateRowDto> list() {
        List<AdminEmailTemplateRowDto> out = new ArrayList<>();
        for (EmailTemplateCode c : EmailTemplateCode.values()) {
            EmailTemplateInfo info = c.info();
            List<AdminEmailTemplateRowDto.LocaleState> locales = new ArrayList<>();
            for (String l : LOCALES) {
                boolean overridden = templateStore.isOverridden(c, l);
                EmailTemplateOverrideEntity meta = overridden
                        ? mongoTemplate.findById(EmailTemplateStore.idOf(c, l), EmailTemplateOverrideEntity.class) : null;
                locales.add(AdminEmailTemplateRowDto.LocaleState.builder().locale(l).overridden(overridden)
                        .updatedAt(meta == null ? null : meta.getUpdatedAt())
                        .updatedBy(meta == null ? null : meta.getUpdatedBy()).build());
            }
            out.add(AdminEmailTemplateRowDto.builder().code(info.code()).name(info.name())
                    .description(info.description()).variables(info.variables()).locales(locales).build());
        }
        return out;
    }

    @Override
    public AdminEmailTemplateDto get(String code, String locale) {
        return toDto(parseCode(code), parseLocale(locale));
    }

    @Override
    public AdminEmailTemplateDto update(String code, String locale, AdminEmailTemplateUpdateDto request) {
        EmailTemplateCode c = parseCode(code);
        String l = parseLocale(locale);
        String subject = request == null ? null : request.getSubject();
        String body = request == null ? null : request.getBody();
        EmailTemplateRenderer.validate(c, subject, body);

        UserEntity actor = auditService.getCurrentUser();
        String id = EmailTemplateStore.idOf(c, l);
        EmailTemplateStore.Template before = templateStore.get(c, l);
        Instant now = Instant.now();
        mongoTemplate.save(EmailTemplateOverrideEntity.builder().id(id).subject(subject).body(body)
                .updatedAt(now).updatedBy(actor.getUserId()).build());
        templateStore.invalidate();
        audit(actor, AuditAction.TEMPLATE_UPDATED, id, before, new EmailTemplateStore.Template(subject, body), now);
        return toDto(c, l);
    }

    @Override
    public AdminEmailTemplateDto reset(String code, String locale) {
        EmailTemplateCode c = parseCode(code);
        String l = parseLocale(locale);
        UserEntity actor = auditService.getCurrentUser();
        String id = EmailTemplateStore.idOf(c, l);
        EmailTemplateStore.Template before = templateStore.get(c, l);
        mongoTemplate.remove(Query.query(Criteria.where("_id").is(id)), EmailTemplateOverrideEntity.class);
        templateStore.invalidate();
        audit(actor, AuditAction.TEMPLATE_RESET, id, before, EmailTemplateStore.defaultOf(c, l), Instant.now());
        return toDto(c, l);
    }

    @Override
    public AdminEmailPreviewDto preview(AdminEmailPreviewRequestDto request) {
        EmailTemplateCode c = parseCode(request == null ? null : request.getCode());
        EmailTemplateRenderer.Rendered r = EmailTemplateRenderer.render(c, request.getSubject(), request.getBody(), sampleValues(c));
        return new AdminEmailPreviewDto(r.subject(), r.body());
    }

    @Override
    public void sendTest(String code, String locale, String toEmail) {
        EmailTemplateCode c = parseCode(code);
        String l = parseLocale(locale);
        String to = checkAddress(toEmail);
        EmailTemplateStore.Template t = templateStore.get(c, l);
        EmailTemplateRenderer.Rendered r = EmailTemplateRenderer.render(c, t.subject(), t.body(), sampleValues(c));
        try {
            sendMessage(to, r.subject(), r.body(), true);
        } catch (FileBusinessException e) {
            throw e;
        } catch (Exception e) {
            // khong gan cause: message SMTP co the chua host hoac user
            throw new FileBusinessException(ErrorCode.MAIL_TEST_FAILED);
        }
    }

    @Override
    public AdminMailTestResultDto testMail(AdminMailTestRequestDto request) {
        String mode = request == null || request.getMode() == null ? "" : request.getMode().trim().toUpperCase(Locale.ROOT);
        if (!mode.equals("CONNECT") && !mode.equals("SEND")) {
            throw new FileBusinessException(ErrorCode.SETTING_INVALID_VALUE);
        }
        String to = mode.equals("SEND") ? checkAddress(blank(request.getToEmail())
                ? auditService.getCurrentUser().getEmail() : request.getToEmail()) : null;
        long start = System.nanoTime();
        try {
            if (mode.equals("CONNECT")) {
                mailSenderFactory.create().testConnection();
            } else {
                sendMessage(to, "SMTP test", "SMTP test from File Sharing admin.", false);
            }
            return AdminMailTestResultDto.builder().ok(true).latencyMs(ms(start)).build();
        } catch (FileBusinessException e) {
            // loi cipher: chi tra ma loi
            return AdminMailTestResultDto.builder().ok(false).latencyMs(ms(start)).error(e.getErrorCode().name()).build();
        } catch (Exception e) {
            // chi ten lop exception, khong tra message vi co the chua host/user
            return AdminMailTestResultDto.builder().ok(false).latencyMs(ms(start))
                    .error(ErrorCode.MAIL_TEST_FAILED.name() + ": " + e.getClass().getSimpleName()).build();
        }
    }

    private void sendMessage(String to, String subject, String body, boolean html) throws Exception {
        JavaMailSenderImpl sender = mailSenderFactory.create();
        MimeMessage m = sender.createMimeMessage();
        MimeMessageHelper h = new MimeMessageHelper(m, true, "UTF-8");
        String from = mailSenderFactory.fromAddress();
        if (!from.isBlank()) h.setFrom(new InternetAddress(from, mailSenderFactory.fromName(), "UTF-8"));
        h.setTo(to);
        h.setSubject(subject);
        h.setText(body, html);
        sender.send(m);
    }

    private Map<String, String> sampleValues(EmailTemplateCode c) {
        String base = runtimeSettings.string(SettingKey.APP_FRONTEND_BASE_URL).replaceAll("/+$", "");
        Map<String, String> all = Map.of(
                "senderEmail", "sender@example.com",
                "fileName", "bao-cao-mau.pdf",
                "downloadLink", base + "/preview/sample-token",
                "toEmail", "user@example.com");
        Map<String, String> out = new HashMap<>();
        for (String v : c.variables()) out.put(v, all.get(v));
        return out;
    }

    private AdminEmailTemplateDto toDto(EmailTemplateCode c, String l) {
        EmailTemplateStore.Template t = templateStore.get(c, l);
        boolean overridden = templateStore.isOverridden(c, l);
        EmailTemplateOverrideEntity meta = overridden
                ? mongoTemplate.findById(EmailTemplateStore.idOf(c, l), EmailTemplateOverrideEntity.class) : null;
        return AdminEmailTemplateDto.builder().code(c.name()).locale(l).subject(t.subject()).body(t.body())
                .overridden(overridden).variables(c.variables().stream().sorted().toList())
                .updatedAt(meta == null ? null : meta.getUpdatedAt())
                .updatedBy(meta == null ? null : meta.getUpdatedBy()).build();
    }

    private void audit(UserEntity actor, AuditAction action, String id, EmailTemplateStore.Template before,
                       EmailTemplateStore.Template after, Instant now) {
        // chi ghi subject va do dai body, khong ghi nguyen body
        Map<String, Object> b = new LinkedHashMap<>();
        b.put("subject", before.subject());
        b.put("bodyLength", before.body().length());
        Map<String, Object> a = new LinkedHashMap<>();
        a.put("subject", after.subject());
        a.put("bodyLength", after.body().length());
        AuditLogEntity log = AuditLogEntity.builder()
                .actorId(actor.getUserId())
                .actorEmail(actor.getEmail())
                .actorType(AuditActorType.ADMIN)
                .action(action)
                .targetType(AuditTargetType.EMAIL_TEMPLATE)
                .targetId(id)
                .targetName(id)
                .projectId(null)
                .changes(new AuditChanges(b, a))
                .timestamp(now)
                .build();
        log.setIsActive(true);
        log.setCreatedBy(actor.getUserId());
        log.setCreatedByEmail(actor.getEmail());
        auditLogRepo.save(log);
    }

    // chan CR/LF va dia chi sai de khong chen header
    private static String checkAddress(String to) {
        try {
            if (to == null || to.contains("\r") || to.contains("\n")) throw new IllegalArgumentException();
            InternetAddress a = new InternetAddress(to.trim(), true);
            a.validate();
            return a.getAddress();
        } catch (Exception e) {
            throw new FileBusinessException(ErrorCode.SETTING_INVALID_VALUE);
        }
    }

    private static EmailTemplateCode parseCode(String code) {
        try {
            return EmailTemplateCode.valueOf(code == null ? "" : code.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new FileBusinessException(ErrorCode.EMAIL_TEMPLATE_INVALID, "unknown template code");
        }
    }

    private static String parseLocale(String locale) {
        String l = locale == null ? "" : locale.trim().toLowerCase(Locale.ROOT);
        if (!LOCALES.contains(l)) throw new FileBusinessException(ErrorCode.EMAIL_TEMPLATE_INVALID, "unknown locale");
        return l;
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }

    private static long ms(long startNanos) {
        return (System.nanoTime() - startNanos) / 1_000_000;
    }
}
