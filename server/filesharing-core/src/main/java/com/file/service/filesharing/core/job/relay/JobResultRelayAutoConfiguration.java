package com.file.service.filesharing.core.job.relay;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.file.service.filesharing.core.job.JobRuntimeAutoConfiguration;
import com.file.service.filesharing.core.job.JobRuntimeProperties;
import com.file.service.filesharing.core.job.JobStore;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.core.KafkaTemplate;

/** Relay ket qua, chay trong worker cung job-types voi job-runtime. spring-kafka la optional trong core. */
@AutoConfiguration(after = JobRuntimeAutoConfiguration.class)
@ConditionalOnClass(KafkaTemplate.class)
@ConditionalOnProperty(prefix = "outbox-relay", name = "enabled", havingValue = "true")
@ConditionalOnBean(JobStore.class)
@EnableConfigurationProperties(OutboxRelayProperties.class)
public class JobResultRelayAutoConfiguration {

    @Bean
    public JobResultRelay jobResultRelay(JobStore store, KafkaTemplate<String, String> kafka, ObjectMapper mapper,
                                         OutboxRelayProperties props, JobRuntimeProperties runtimeProps) {
        return new JobResultRelay(store, kafka, mapper, props, runtimeProps);
    }
}
