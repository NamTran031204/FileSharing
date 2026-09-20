package com.file.service.filesharing.core.enums;

// Dich ma OutboxRelay phat event den (ADR-001 QD-4)
public enum OutboxSink {
    // upsert vao processing_jobs - job.ready tu filehandler sang worker
    JOB_STORE,
    // kafka.send - ket qua worker ve filehandler, email
    KAFKA
}
