package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.AuditLogEntity;
import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;
import com.file.service.filesharing.core.entity.models.WorkerNodeEntity;
import com.file.service.filesharing.core.entity.models.auditlog.AuditChanges;
import com.file.service.filesharing.core.enums.AuditAction;
import com.file.service.filesharing.core.enums.AuditActorType;
import com.file.service.filesharing.core.enums.AuditTargetType;
import com.file.service.filesharing.core.enums.ProcessingJobStatus;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import com.file.service.filesharing.core.node.NodeStatus;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.admin.AdminNodeDto;
import org.example.filesharing.entities.dtos.admin.AdminNodeRunningJobDto;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.repositories.AuditLogRepo;
import org.example.filesharing.services.AdminNodeService;
import org.example.filesharing.services.AuditService;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminNodeServiceImpl implements AdminNodeService {

    private static final String KIND_WORKER = "WORKER";

    private final MongoTemplate mongoTemplate;
    private final AuditService auditService;
    private final AuditLogRepo auditLogRepo;

    @Override
    public List<AdminNodeDto> getAll() {
        List<WorkerNodeEntity> nodes = mongoTemplate.find(
                Query.query(new Criteria()).with(Sort.by("service", "nodeId")), WorkerNodeEntity.class);
        Map<String, List<AdminNodeRunningJobDto>> jobs = runningJobs(nodes);
        Instant now = Instant.now();
        return nodes.stream().map(n -> toDto(n, now, jobs.getOrDefault(n.getNodeId(), List.of()))).toList();
    }

    @Override
    public AdminNodeDto setDraining(String nodeId, boolean draining) {
        WorkerNodeEntity node = nodeId == null ? null : mongoTemplate.findById(nodeId, WorkerNodeEntity.class);
        // node API/NOTIFICATION khong co hang doi job nen khong drain duoc, coi nhu khong tim thay
        if (node == null || !KIND_WORKER.equals(node.getKind())) {
            throw new FileBusinessException(ErrorCode.NODE_NOT_FOUND);
        }
        boolean before = Boolean.TRUE.equals(node.getDraining());
        mongoTemplate.updateFirst(Query.query(Criteria.where("_id").is(nodeId)),
                new Update().set("draining", draining), WorkerNodeEntity.class);
        node.setDraining(draining);
        audit(node, before, draining);
        return toDto(node, Instant.now(), runningJobs(List.of(node)).getOrDefault(nodeId, List.of()));
    }

    // chi doc metadata ky thuat theo workerId, khong join sang user/project/asset
    private Map<String, List<AdminNodeRunningJobDto>> runningJobs(List<WorkerNodeEntity> nodes) {
        if (nodes.isEmpty()) return Map.of();
        Query q = Query.query(Criteria.where("status").is(ProcessingJobStatus.PROCESSING)
                .and("workerId").in(nodes.stream().map(WorkerNodeEntity::getNodeId).toList()));
        q.fields().include("jobId", "jobType", "progress", "startedAt", "workerId");
        Map<String, List<AdminNodeRunningJobDto>> out = new HashMap<>();
        for (ProcessingJobEntity j : mongoTemplate.find(q, ProcessingJobEntity.class)) {
            out.computeIfAbsent(j.getWorkerId(), k -> new ArrayList<>()).add(AdminNodeRunningJobDto.builder()
                    .jobId(j.getJobId())
                    .jobType(j.getJobType() == null ? null : j.getJobType().name())
                    .percent(j.getProgress() == null ? null : j.getProgress().getPercent())
                    .currentStep(j.getProgress() == null ? null : j.getProgress().getCurrentStep())
                    .startedAt(j.getStartedAt())
                    .build());
        }
        return out;
    }

    private AdminNodeDto toDto(WorkerNodeEntity n, Instant now, List<AdminNodeRunningJobDto> jobs) {
        boolean draining = Boolean.TRUE.equals(n.getDraining());
        return AdminNodeDto.builder()
                .nodeId(n.getNodeId()).service(n.getService()).kind(n.getKind()).host(n.getHost())
                .pid(n.getPid()).cores(n.getCores()).startedAt(n.getStartedAt()).lastSeenAt(n.getLastSeenAt())
                .status(NodeStatus.of(n.getLastSeenAt(), draining, now).name())
                .draining(draining)
                .cpu(n.getCpu()).memory(n.getMemory()).workspaceFreeBytes(n.getWorkspaceFreeBytes())
                .worker(n.getWorker()).samples(n.getSamples()).runningJobs(jobs)
                .build();
    }

    private void audit(WorkerNodeEntity node, boolean before, boolean after) {
        UserEntity actor = auditService.getCurrentUser();
        AuditLogEntity log = AuditLogEntity.builder()
                .actorId(actor.getUserId())
                .actorEmail(actor.getEmail())
                .actorType(AuditActorType.ADMIN)
                .action(AuditAction.NODE_DRAINED)
                .targetType(AuditTargetType.NODE)
                .targetId(node.getNodeId())
                .targetName(node.getService())
                .projectId(null)
                .changes(new AuditChanges(Map.of("draining", before), Map.of("draining", after)))
                .timestamp(Instant.now())
                .build();
        log.setIsActive(true);
        log.setCreatedBy(actor.getUserId());
        log.setCreatedByEmail(actor.getEmail());
        auditLogRepo.save(log);
    }
}
