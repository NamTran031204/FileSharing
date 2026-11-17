package com.file.service.filesharing.core.job.relay;

import com.file.service.filesharing.core.setting.RuntimeSettings;
import com.file.service.filesharing.core.setting.SettingKey;
import lombok.AccessLevel;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@Data
@ConfigurationProperties("outbox-relay")
public class OutboxRelayProperties {
    private boolean enabled = false;
    private String topic = "job_result_topic";
    private Duration interval = Duration.ofSeconds(1);
    // Thoi gian giu cho 1 ban ghi dang duoc relay gui, het han thi relay khac (hoac lan sau) gui lai
    private Duration lease = Duration.ofSeconds(30);

    // Nguon setting dong; null thi dung gia tri bind tu yml
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private RuntimeSettings settings;

    public void attach(RuntimeSettings settings) {
        this.settings = settings;
    }

    // relay-lease la key LIVE: doc moi lan claim
    public Duration getLease() {
        return settings == null ? lease : settings.duration(SettingKey.JOB_RELAY_LEASE);
    }
}
