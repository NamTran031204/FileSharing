package org.example.filesharing.entities.dtos.admin;

import com.file.service.filesharing.core.entity.models.WorkerNodeEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

// status: ONLINE | STALE | DRAINING (tinh luc doc, STALE khi lastSeenAt qua 15s)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminNodeDto {
    private String nodeId;
    private String service;
    private String kind;
    private String host;
    private Long pid;
    private Integer cores;
    private Instant startedAt;
    private Instant lastSeenAt;
    private String status;
    private boolean draining;
    private WorkerNodeEntity.Cpu cpu;
    private WorkerNodeEntity.Memory memory;
    private Long workspaceFreeBytes;
    private WorkerNodeEntity.Worker worker;
    private List<WorkerNodeEntity.Sample> samples;
    private List<AdminNodeRunningJobDto> runningJobs;
}
