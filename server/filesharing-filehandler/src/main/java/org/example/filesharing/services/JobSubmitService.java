package org.example.filesharing.services;

import com.file.service.filesharing.core.entity.models.MetadataEntity;

public interface JobSubmitService {

    /**
     * Tao job xu ly cho metadata bang upsert idempotent tren {metadataId, jobType}.
     * Goi nhieu lan khong tao them job va khong reset job dang chay.
     *
     * @return jobId (ObjectId hex) cua job hien co hoac vua tao
     */
    String submit(MetadataEntity metadata);
}
