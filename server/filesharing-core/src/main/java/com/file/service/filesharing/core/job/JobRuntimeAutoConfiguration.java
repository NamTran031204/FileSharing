package com.file.service.filesharing.core.job;

import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.bulkhead.BulkheadRegistry;
import io.minio.MinioClient;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.List;

@AutoConfiguration(after = com.file.service.filesharing.core.CoreAutoConfiguration.class)
@EnableScheduling
@EnableConfigurationProperties(JobRuntimeProperties.class)
@ConditionalOnProperty(prefix = "job-runtime", name = "enabled", havingValue = "true")
@ConditionalOnBean(JobExecutor.class)
public class JobRuntimeAutoConfiguration {

    @Bean
    public WorkerIdentity workerIdentity() {
        return new WorkerIdentity();
    }

    @Bean
    public JobStore jobStore(MongoTemplate mongo, JobRuntimeProperties props) {
        return new JobStore(mongo, props);
    }

    @Bean
    public JobStorage jobStorage(MinioClient minio) {
        return new JobStorage(minio);
    }

    @Bean
    public JobRuntime jobRuntime(JobStore store, JobStorage storage, JobRuntimeProperties props,
                                 WorkerIdentity identity, List<JobExecutor> executors) {
        return new JobRuntime(store, storage, props, identity, executors);
    }

    @Bean
    public JobDispatcher jobDispatcher(ObjectProvider<BulkheadRegistry> registry, JobStore store, JobRuntime runtime,
                                       JobRuntimeProperties props, WorkerIdentity identity) {
        BulkheadRegistry reg = registry.getIfAvailable(BulkheadRegistry::ofDefaults);
        Bulkhead bulkhead = reg.bulkhead(props.getBulkheadName());
        return new JobDispatcher(bulkhead, store, runtime, props, identity);
    }

    @Bean
    public LeaseReaper leaseReaper(JobStore store, JobRuntimeProperties props) {
        return new LeaseReaper(store, props);
    }

    @Bean
    @ConditionalOnProperty(prefix = "job-runtime.doorbell", name = "enabled", havingValue = "true", matchIfMissing = true)
    public JobChangeStreamDoorbell jobChangeStreamDoorbell(MongoTemplate mongo, JobDispatcher dispatcher) {
        return new JobChangeStreamDoorbell(mongo, dispatcher);
    }
}
