package com.file.service.filesharing.core.entity.models.processing;

import com.file.service.filesharing.core.enums.OutboxEventStatus;
import com.file.service.filesharing.core.enums.OutboxSink;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

// Event cho phat, nhung ngay trong document cua aggregate (ADR-001 QD-2).
// Ghi 1 document trong Mongo da atomic san nen khong can transaction.
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutboxEvent {
    private String id;
    // Ten loai event, vi du "job.ready", "job.result"
    private String type;
    private OutboxSink sink;
    // Chi dung khi sink = KAFKA
    private String topic;
    private Map<String, Object> payload;
    private OutboxEventStatus status;
    // So lan relay da thu phat, dung de tinh backoff
    private Integer attempts;
    // Som nhat duoc thu phat lai
    private Instant dueAt;
    private Instant createdAt;
    private Instant sentAt;
}
