package com.file.service.filesharing.core.mail;

import com.file.service.filesharing.core.setting.RuntimeSettings;
import com.file.service.filesharing.core.setting.SettingAutoConfiguration;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.Duration;

@AutoConfiguration(after = {MongoDataAutoConfiguration.class, SettingAutoConfiguration.class})
public class MailAutoConfiguration {

    @Bean
    @ConditionalOnBean(MongoTemplate.class)
    @ConditionalOnMissingBean
    public EmailTemplateStore emailTemplateStore(MongoTemplate mongo, Environment env) {
        Duration ttl = env.getProperty("email-template.cache-ttl", Duration.class, Duration.ofSeconds(10));
        return new EmailTemplateStore(mongo, ttl);
    }

    /** lop long rieng: worker khong co lib mail thi class nay khong bao gio duoc nap */
    @Configuration(proxyBeanMethods = false)
    @ConditionalOnClass(name = "org.springframework.mail.javamail.JavaMailSenderImpl")
    static class MailSenderConfiguration {
        @Bean
        @ConditionalOnBean(RuntimeSettings.class)
        @ConditionalOnMissingBean
        MailSenderFactory mailSenderFactory(RuntimeSettings settings) {
            return new MailSenderFactory(settings);
        }
    }
}
