package com.file.service.filesharing.core.setting;

import com.file.service.filesharing.core.entity.models.SystemSettingEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.convert.DurationStyle;
import org.springframework.core.env.Environment;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.util.unit.DataSize;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Gia tri hieu luc cua setting: override trong Mongo, neu khong co thi env cu (chi trong bo nho),
 * neu khong co thi mac dinh trong SettingKey. Cache lam moi dinh ky; mat DB thi giu ban cu.
 * Dung luong rieng thay vi @Scheduled de khong phu thuoc @EnableScheduling cua tung service.
 */
public class RuntimeSettings implements InitializingBean, DisposableBean {

    private static final Logger log = LoggerFactory.getLogger(RuntimeSettings.class);

    private final MongoTemplate mongo;
    private final SettingCipher cipher;
    private final Environment env;
    private final Duration refreshEvery;

    private volatile Map<String, String> overrides = Map.of();
    private ScheduledExecutorService scheduler;

    public RuntimeSettings(MongoTemplate mongo, SettingCipher cipher, Environment env, Duration refreshEvery) {
        this.mongo = mongo;
        this.cipher = cipher;
        this.env = env;
        this.refreshEvery = refreshEvery;
    }

    @Override
    public void afterPropertiesSet() {
        refresh();
        scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "runtime-settings-refresh");
            t.setDaemon(true);
            return t;
        });
        scheduler.scheduleWithFixedDelay(this::refresh, refreshEvery.toMillis(), refreshEvery.toMillis(),
                TimeUnit.MILLISECONDS);
    }

    @Override
    public void destroy() {
        if (scheduler != null) scheduler.shutdownNow();
    }

    /** nap lai override; loi thi giu ban cu va chi log ten loi (khong log gia tri) */
    public void refresh() {
        try {
            Map<String, String> next = new HashMap<>();
            for (SystemSettingEntity e : mongo.findAll(SystemSettingEntity.class)) {
                if (e.getKey() != null && e.getValue() != null) next.put(e.getKey(), e.getValue());
            }
            overrides = Map.copyOf(next);
        } catch (RuntimeException e) {
            log.warn("doc system_settings loi, giu ban cu: {}", e.getClass().getSimpleName());
        }
    }

    /** gia tri raw hieu luc; voi secret chi nen dung secret() */
    public String raw(SettingKey k) {
        if (k.group().isFixed()) return FixedSettings.DEFAULTS.raw(k);
        String o = overrides.get(k.key());
        if (o != null) return o;
        if (k.envFallback() != null) {
            String e = env.getProperty(k.envFallback());
            if (e != null && !e.isBlank()) return e;
        }
        if (k.defaultValue().isEmpty() && k.fallbackKey() != null) {
            SettingKey other = SettingKey.of(k.fallbackKey());
            if (other != null) return raw(other);
        }
        return k.defaultValue();
    }

    public boolean isOverridden(SettingKey k) {
        if (k.group().isFixed()) return false;
        return overrides.containsKey(k.key());
    }

    public int intValue(SettingKey k) {
        return Integer.parseInt(raw(k));
    }

    public long longValue(SettingKey k) {
        return Long.parseLong(raw(k));
    }

    public boolean boolValue(SettingKey k) {
        return Boolean.parseBoolean(raw(k));
    }

    public String string(SettingKey k) {
        return raw(k);
    }

    public Duration duration(SettingKey k) {
        return DurationStyle.detectAndParse(raw(k));
    }

    public DataSize dataSize(SettingKey k) {
        return DataSize.parse(raw(k));
    }

    public List<String> list(SettingKey k) {
        return SettingValidator.splitList(raw(k));
    }

    /** secret: override la ciphertext FSENC1, con env cu thi la plaintext trong bo nho. Loi khoa -> SETTING_CIPHER_FAILED */
    public String secret(SettingKey k) {
        String o = overrides.get(k.key());
        if (o != null) return cipher.decrypt(o);
        return raw(k);
    }
}
