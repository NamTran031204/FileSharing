package com.file.service.filesharing.core.job;

import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;

/** Thu hoi job PROCESSING het lease: ve PENDING hoac DEAD_LETTER khi het retry. */
@Slf4j
public class LeaseReaper {
    private final JobStore store;
    private final JobRuntimeProperties props;

    public LeaseReaper(JobStore store, JobRuntimeProperties props) {
        this.store = store;
        this.props = props;
    }

    @Scheduled(fixedDelayString = "${job-runtime.reaper-interval:15s}")
    public void reapExpired() {
        try {
            for (ProcessingJobEntity doc : store.findExpired(props.getJobTypes(), 100)) {
                if (store.reap(doc)) {
                    log.warn("thu hoi job het lease job={} attempt={} worker={}", doc.getJobId(), doc.getAttemptId(), doc.getWorkerId());
                }
            }
        } catch (Exception e) {
            log.error("reaper loi: {}", e.getMessage(), e);
        }
    }
}
