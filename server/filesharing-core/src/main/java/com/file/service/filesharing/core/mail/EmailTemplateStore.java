package com.file.service.filesharing.core.mail;

import com.file.service.filesharing.core.entity.models.EmailTemplateOverrideEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Template hieu luc = override trong Mongo (email_templates), khong co thi mac dinh trong code.
 * Cache ngan, nap lai lazy khi het han; loi DB thi giu ban cu.
 */
public class EmailTemplateStore {

    private static final Logger log = LoggerFactory.getLogger(EmailTemplateStore.class);

    public record Template(String subject, String body) {
    }

    private final MongoTemplate mongo;
    private final long ttlNanos;

    private volatile Map<String, EmailTemplateOverrideEntity> cache = Map.of();
    private volatile boolean stale = true;
    private volatile long loadedAt;

    public EmailTemplateStore(MongoTemplate mongo, Duration ttl) {
        this.mongo = mongo;
        this.ttlNanos = ttl.toNanos();
    }

    public static String normalizeLocale(String locale) {
        return locale != null && locale.toLowerCase().startsWith("en") ? "en" : "vi";
    }

    public static String idOf(EmailTemplateCode code, String locale) {
        return code.name() + ":" + normalizeLocale(locale);
    }

    public Template get(EmailTemplateCode code, String locale) {
        EmailTemplateOverrideEntity o = overrides().get(idOf(code, locale));
        if (o != null && o.getSubject() != null && o.getBody() != null) {
            return new Template(o.getSubject(), o.getBody());
        }
        return defaultOf(code, locale);
    }

    public static Template defaultOf(EmailTemplateCode code, String locale) {
        return EmailTemplateDefaults.of(code, normalizeLocale(locale));
    }

    public boolean isOverridden(EmailTemplateCode code, String locale) {
        return overrides().containsKey(idOf(code, locale));
    }

    /** bo cache de lan doc sau thay ngay (goi sau khi luu/reset override) */
    public void invalidate() {
        stale = true;
    }

    private Map<String, EmailTemplateOverrideEntity> overrides() {
        if (stale || System.nanoTime() - loadedAt > ttlNanos) {
            try {
                Map<String, EmailTemplateOverrideEntity> next = new HashMap<>();
                for (EmailTemplateOverrideEntity e : mongo.findAll(EmailTemplateOverrideEntity.class)) {
                    if (e.getId() != null) next.put(e.getId(), e);
                }
                cache = Map.copyOf(next);
            } catch (RuntimeException e) {
                log.warn("doc email_templates loi, giu ban cu: {}", e.getClass().getSimpleName());
            }
            loadedAt = System.nanoTime();
            stale = false;
        }
        return cache;
    }
}
