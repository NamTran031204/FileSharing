package com.file.service.filesharing.core.mail;

import com.file.service.filesharing.core.setting.RuntimeSettings;
import com.file.service.filesharing.core.setting.SettingKey;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

/**
 * Dung JavaMailSender tu setting nhom MAIL moi lan goi (re), nen doi setting co hieu luc ngay.
 * Lop nay can spring-boot-starter-mail (optional trong core); chi duoc nap khi co lib (xem MailAutoConfiguration).
 */
public class MailSenderFactory {

    private final RuntimeSettings settings;

    public MailSenderFactory(RuntimeSettings settings) {
        this.settings = settings;
    }

    public JavaMailSenderImpl create() {
        JavaMailSenderImpl s = new JavaMailSenderImpl();
        s.setHost(settings.string(SettingKey.MAIL_HOST));
        s.setPort(settings.intValue(SettingKey.MAIL_PORT));
        s.setDefaultEncoding("UTF-8");
        String user = settings.string(SettingKey.MAIL_USERNAME);
        if (!user.isBlank()) {
            s.setUsername(user);
            s.setPassword(settings.secret(SettingKey.MAIL_PASSWORD));
        }
        Properties p = s.getJavaMailProperties();
        p.put("mail.smtp.auth", String.valueOf(settings.boolValue(SettingKey.MAIL_AUTH)));
        p.put("mail.smtp.starttls.enable", String.valueOf(settings.boolValue(SettingKey.MAIL_STARTTLS)));
        p.put("mail.smtp.connectiontimeout", String.valueOf(settings.duration(SettingKey.MAIL_CONNECTION_TIMEOUT).toMillis()));
        p.put("mail.smtp.timeout", String.valueOf(settings.duration(SettingKey.MAIL_TIMEOUT).toMillis()));
        p.put("mail.smtp.writetimeout", String.valueOf(settings.duration(SettingKey.MAIL_WRITE_TIMEOUT).toMillis()));
        return s;
    }

    public String fromAddress() {
        return settings.string(SettingKey.MAIL_FROM_ADDRESS);
    }

    public String fromName() {
        return settings.string(SettingKey.MAIL_FROM_NAME);
    }
}
