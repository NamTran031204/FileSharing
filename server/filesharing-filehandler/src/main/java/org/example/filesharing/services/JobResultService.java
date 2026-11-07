package org.example.filesharing.services;

import com.file.service.filesharing.core.job.relay.JobResultMessage;

public interface JobResultService {

    /**
     * Ap ket qua cuoi cua job len metadata bang update co dieu kien. Idempotent: ket qua trung,
     * ket qua cua job khac currentJobId, ket qua cu hon deu bi bo qua. Loi he thong thi nem ra de consumer retry.
     *
     * @return true neu ket qua duoc ap, false neu bi bo qua
     */
    boolean apply(JobResultMessage msg);
}
