package com.file.service.filesharing.core.job;

import com.file.service.filesharing.core.enums.ProcessingJobType;
import com.file.service.filesharing.core.job.exception.PermanentJobException;
import com.file.service.filesharing.core.job.exception.TransientJobException;

import java.util.Set;

// SPI: moi worker chi viet 1 lop implements JobExecutor, phan con lai do runtime lo.
public interface JobExecutor {
    Set<ProcessingJobType> supportedTypes();

    InputMode inputMode();

    JobExecution process(JobContext ctx) throws PermanentJobException, TransientJobException;
}
