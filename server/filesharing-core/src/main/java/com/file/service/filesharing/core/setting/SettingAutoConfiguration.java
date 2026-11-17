package com.file.service.filesharing.core.setting;

import com.ulisesbocchio.jasyptspringboot.annotation.EnableEncryptableProperties;
import org.jasypt.encryption.StringEncryptor;
import org.jasypt.encryption.pbe.PooledPBEStringEncryptor;
import org.jasypt.encryption.pbe.config.SimpleStringPBEConfig;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.Duration;

/**
 * Jasypt 3.0.5 khong tu dang ky tren Spring Boot 3 (khong co AutoConfiguration.imports) nen bat tay
 * bang EnableEncryptableProperties, de gia tri ENC(...) trong env/yml van giai ma duoc.
 * Khoa chu chi lay tu env JASYPT_ENCRYPTOR_PASSWORD; thieu khoa thi chi loi khi dung den ma hoa
 * (service khong dung secret van khoi dong binh thuong).
 */
@AutoConfiguration(after = MongoDataAutoConfiguration.class)
@EnableEncryptableProperties
public class SettingAutoConfiguration {

    @Bean("jasyptStringEncryptor")
    @ConditionalOnMissingBean(name = "jasyptStringEncryptor")
    public StringEncryptor jasyptStringEncryptor(Environment env) {
        String key = env.getProperty("JASYPT_ENCRYPTOR_PASSWORD");
        SimpleStringPBEConfig c = new SimpleStringPBEConfig();
        c.setPassword(key == null || key.isBlank() ? null : key);
        c.setAlgorithm("PBEWITHHMACSHA512ANDAES_256");
        c.setKeyObtentionIterations("100000");
        c.setPoolSize("1");
        c.setProviderName("SunJCE");
        c.setSaltGeneratorClassName("org.jasypt.salt.RandomSaltGenerator");
        c.setIvGeneratorClassName("org.jasypt.iv.RandomIvGenerator");
        c.setStringOutputType("base64");
        PooledPBEStringEncryptor e = new PooledPBEStringEncryptor();
        e.setConfig(c);
        return e;
    }

    @Bean
    @ConditionalOnMissingBean
    public SettingCipher settingCipher(StringEncryptor jasyptStringEncryptor) {
        return new SettingCipher(jasyptStringEncryptor);
    }

    @Bean
    @ConditionalOnBean(MongoTemplate.class)
    @ConditionalOnMissingBean
    public RuntimeSettings runtimeSettings(MongoTemplate mongo, SettingCipher cipher, Environment env) {
        Duration every = env.getProperty("runtime-settings.refresh", Duration.class, Duration.ofSeconds(10));
        return new RuntimeSettings(mongo, cipher, env, every);
    }
}
