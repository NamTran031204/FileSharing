package com.file.service.filesharing.core.job.relay;

import lombok.Data;
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
}
