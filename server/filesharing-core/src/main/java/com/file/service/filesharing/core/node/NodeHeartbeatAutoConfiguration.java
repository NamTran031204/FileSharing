package com.file.service.filesharing.core.node;

import com.file.service.filesharing.core.entity.models.WorkerNodeEntity;
import com.file.service.filesharing.core.job.JobRuntimeAutoConfiguration;
import com.file.service.filesharing.core.job.JobRuntimeProperties;
import com.file.service.filesharing.core.job.WorkerIdentity;
import io.github.resilience4j.bulkhead.Bulkhead;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.Duration;
import java.util.function.Supplier;

/** node.kind: WORKER | API | NOTIFICATION (mac dinh API); tat bang node-heartbeat.enabled=false. */
@AutoConfiguration(after = {MongoDataAutoConfiguration.class, JobRuntimeAutoConfiguration.class})
@ConditionalOnProperty(prefix = "node-heartbeat", name = "enabled", havingValue = "true", matchIfMissing = true)
public class NodeHeartbeatAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public NodeControl nodeControl() {
        return new NodeControl();
    }

    @Bean
    @ConditionalOnBean(MongoTemplate.class)
    public NodeHeartbeat nodeHeartbeat(MongoTemplate mongo, NodeControl control, Environment env,
                                       ObjectProvider<WorkerIdentity> identity,
                                       ObjectProvider<Bulkhead> bulkhead,
                                       ObjectProvider<JobRuntimeProperties> props) {
        String service = env.getProperty("spring.application.name", "unknown");
        String kind = env.getProperty("node.kind", "API");
        WorkerIdentity wi = identity.getIfAvailable();
        // worker dung chinh workerId de runningJobs (processing_jobs.workerId) khop nodeId
        String nodeId = wi != null ? wi.workerId()
                : service + "-" + ProcessHandle.current().pid() + "-" + new ObjectId().toHexString();
        Duration every = env.getProperty("node-heartbeat.interval", Duration.class, Duration.ofSeconds(5));

        Bulkhead bh = bulkhead.getIfUnique();
        JobRuntimeProperties jp = props.getIfAvailable();
        Supplier<WorkerNodeEntity.Worker> worker = bh == null || jp == null ? null : () -> {
            int max = bh.getBulkheadConfig().getMaxConcurrentCalls();
            return new WorkerNodeEntity.Worker(jp.getJobTypes().stream().map(Enum::name).toList(),
                    jp.getBulkheadName(), max, Math.max(0, max - bh.getMetrics().getAvailableConcurrentCalls()));
        };
        return new NodeHeartbeat(mongo, control, nodeId, service, kind, every, worker);
    }
}
