package com.file.service.filesharingimagecodec.job;

import com.file.service.filesharingimagecodec.config.ImageProcessingConfig;
import com.file.service.filesharing.core.enums.ProcessingJobStatus;
import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;
import com.file.service.filesharing.core.entity.models.processing.ProcessingJobProgress;
import com.file.service.filesharing.core.entity.models.processing.ProcessingJobResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final ImageProcessingConfig config;
    private final MongoTemplate mongoTemplate;

    // dam bao tinh persist va atomic hon
    public ProcessingJobEntity setProcessingJob() {
        log.info("choc xuong db");
        return mongoTemplate.findAndModify(
                Query.query(
                                Criteria.where("status").is(ProcessingJobStatus.PENDING)
                        ).with(Sort.by(Sort.Direction.ASC, "scheduleAt"))
                        .limit(1),
                new Update()
                        .set("status", ProcessingJobStatus.PROCESSING)
                        .set("workerId", getWorkerId())
                        .set("startedAt", Instant.now()),
                FindAndModifyOptions.options().returnNew(true),
                ProcessingJobEntity.class
        );
    }

    public void updateProgress(String jobId, int percent, String currentStep) {
        jobRepository.findById(jobId).ifPresent(job -> {
            job.setProgress(ProcessingJobProgress.builder()
                    .percent(percent)
                    .currentStep(currentStep)
                    .build());
            job.setWorkerHeartbeat(Instant.now());
            jobRepository.save(job);
        });
    }

    public void markCompleted(String jobId, List<String> outputKeys, String primaryOutput) {
        jobRepository.findById(jobId).ifPresent(job -> {
            job.setStatus(ProcessingJobStatus.COMPLETED);
            job.setCompletedAt(Instant.now());
            job.setProgress(ProcessingJobProgress.builder()
                    .percent(100)
                    .currentStep("COMPLETED")
                    .build());
            job.setResult(ProcessingJobResult.builder()
                    .success(true)
                    .outputKeys(outputKeys)
                    .build());
            jobRepository.save(job);
            log.info("job {} duoc danh dau la COMPLETED. dau ra: {}", jobId, primaryOutput);
        });
    }

    /**
     * đánh dấu job thất bại với logic thử lại.
     * nếu còn số lần thử lại, đưa vào hàng đợi lại. nếu không, thất bại vĩnh viễn.
     */
    public void markFailed(String jobId, String error) {
        jobRepository.findById(jobId).ifPresent(job -> {
            int currentRetry = job.getRetryCount() != null ? job.getRetryCount() : 0;
            int maxRetries = job.getMaxRetries() != null ? job.getMaxRetries() : config.getRetry().getMaxAttempts();

            if (currentRetry + 1 < maxRetries) {
                job.setStatus(ProcessingJobStatus.PENDING);
                job.setRetryCount(currentRetry + 1);
                job.setLastError(error);
                job.setProgress(ProcessingJobProgress.builder()
                        .percent(0)
                        .currentStep("RETRY_PENDING")
                        .build());
                jobRepository.save(job);
                log.warn("job {} that bai (lan thu {}/{}), duoc dua vao hang doi lai: {}",
                        jobId, currentRetry + 1, maxRetries, error);
            } else {
                markFailedPermanently(jobId, error);
            }
        });
    }

    /**
     * đánh dấu job thất bại vĩnh viễn (không thử lại).
     * được sử dụng cho đầu vào bị hỏng hoặc các lỗi xác định.
     */
    public void markFailedPermanently(String jobId, String error) {
        jobRepository.findById(jobId).ifPresent(job -> {
            job.setStatus(ProcessingJobStatus.FAILED);
            job.setRetryCount((job.getRetryCount() != null ? job.getRetryCount() : 0) + 1);
            job.setLastError(error);
            job.setCompletedAt(Instant.now());
            job.setProgress(ProcessingJobProgress.builder()
                    .percent(0)
                    .currentStep("FAILED")
                    .build());
            job.setResult(ProcessingJobResult.builder()
                    .success(false)
                    .errorMessage(error)
                    .build());
            jobRepository.save(job);
            log.error("job {} that bai vinh vien: {}", jobId, error);
        });
    }

    /**
     * khôi phục khi khởi động: đặt lại tất cả các job PROCESSING về PENDING.
     * todo: didnhj nghia workerId sau do cho tim kiem theo workerId thay vi tim theo status nhu hien tai vi code lan nay la cho 1 VM
     */
    @EventListener(ApplicationReadyEvent.class)
    public void recoverRunningJobs() {
        List<ProcessingJobEntity> stuckJobs = jobRepository.findAllByStatus(ProcessingJobStatus.PROCESSING);
        if (stuckJobs.isEmpty()) {
            log.info("khong tim thay job nao bi mac ket trong qua trinh khoi phuc khi khoi dong");
            return;
        }

        log.warn("tim thay {} job PROCESSING bi mac ket, dat lai thanh PENDING", stuckJobs.size());
        for (ProcessingJobEntity job : stuckJobs) {
            job.setStatus(ProcessingJobStatus.PENDING);
            job.setProgress(ProcessingJobProgress.builder()
                    .percent(0)
                    .currentStep("RECOVERED")
                    .build());
            jobRepository.save(job);
            log.info("da khoi phuc job {} → PENDING, da dua vao hang doi lai", job.getJobId());
        }
    }

    private String getWorkerId() {
        return "worker-" + ProcessHandle.current().pid();
    }
}
