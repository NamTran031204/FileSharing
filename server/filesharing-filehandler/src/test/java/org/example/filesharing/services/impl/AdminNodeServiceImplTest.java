package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.AuditLogEntity;
import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;
import com.file.service.filesharing.core.entity.models.WorkerNodeEntity;
import com.file.service.filesharing.core.entity.models.processing.ProcessingJobProgress;
import com.file.service.filesharing.core.enums.AuditAction;
import com.file.service.filesharing.core.enums.AuditActorType;
import com.file.service.filesharing.core.enums.AuditTargetType;
import com.file.service.filesharing.core.enums.ProcessingJobStatus;
import com.file.service.filesharing.core.enums.ProcessingJobType;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import org.example.filesharing.entities.dtos.admin.AdminNodeDto;
import org.example.filesharing.entities.dtos.admin.AdminNodeRunningJobDto;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.repositories.AuditLogRepo;
import org.example.filesharing.services.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.UpdateDefinition;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminNodeServiceImplTest {

    @Mock MongoTemplate mongo;
    @Mock AuditService auditService;
    @Mock AuditLogRepo auditLogRepo;
    AdminNodeServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminNodeServiceImpl(mongo, auditService, auditLogRepo);
        when(auditService.getCurrentUser()).thenReturn(UserEntity.builder().userId("sa1").email("sa1@test.com").build());
    }

    private static WorkerNodeEntity node(String id, String kind, Instant seen, boolean draining) {
        return WorkerNodeEntity.builder().nodeId(id).service("svc-" + id).kind(kind)
                .lastSeenAt(seen).draining(draining).build();
    }

    @Test
    void statusStaleAfter15sOnlineBeforeDrainingWhenFresh() {
        Instant now = Instant.now();
        when(mongo.find(any(Query.class), eq(WorkerNodeEntity.class))).thenReturn(List.of(
                node("a", "WORKER", now.minusSeconds(3), false),
                node("b", "WORKER", now.minusSeconds(20), false),
                node("c", "WORKER", now.minusSeconds(3), true),
                node("d", "WORKER", now.minusSeconds(40), true)));
        when(mongo.find(any(Query.class), eq(ProcessingJobEntity.class))).thenReturn(List.of());

        List<AdminNodeDto> out = service.getAll();
        assertEquals("ONLINE", out.get(0).getStatus());
        assertEquals("STALE", out.get(1).getStatus());
        assertEquals("DRAINING", out.get(2).getStatus());
        assertEquals("STALE", out.get(3).getStatus());
    }

    @Test
    void runningJobsGroupedByWorkerAndHaveNoForbiddenFields() {
        Instant now = Instant.now();
        when(mongo.find(any(Query.class), eq(WorkerNodeEntity.class)))
                .thenReturn(List.of(node("a", "WORKER", now, false), node("b", "API", now, false)));
        ProcessingJobEntity j = new ProcessingJobEntity();
        j.setJobId("j1");
        j.setWorkerId("a");
        j.setJobType(ProcessingJobType.values()[0]);
        j.setStatus(ProcessingJobStatus.PROCESSING);
        j.setObjectName("secret/object.mp4");
        j.setMetadataId("m1");
        j.setAssetId("as1");
        j.setStartedAt(now);
        ProcessingJobProgress p = new ProcessingJobProgress();
        p.setPercent(40);
        p.setCurrentStep("encode");
        j.setProgress(p);
        when(mongo.find(any(Query.class), eq(ProcessingJobEntity.class))).thenReturn(List.of(j));

        List<AdminNodeDto> out = service.getAll();
        assertEquals(1, out.get(0).getRunningJobs().size());
        assertTrue(out.get(1).getRunningJobs().isEmpty());
        AdminNodeRunningJobDto r = out.get(0).getRunningJobs().get(0);
        assertEquals("j1", r.getJobId());
        assertEquals(40, r.getPercent());

        Set<String> forbidden = Set.of("objectName", "metadataId", "assetId", "thumbnailUrl", "outputKeys",
                "manifestKey", "shareToken", "ownerId", "userId", "projectId");
        for (Class<?> c : List.of(AdminNodeRunningJobDto.class, AdminNodeDto.class)) {
            for (Field f : c.getDeclaredFields()) assertFalse(forbidden.contains(f.getName()), f.getName());
        }
        // truy van job chi lay field ky thuat
        ArgumentCaptor<Query> q = ArgumentCaptor.forClass(Query.class);
        verify(mongo).find(q.capture(), eq(ProcessingJobEntity.class));
        assertFalse(q.getValue().getFieldsObject().containsKey("objectName"));
        assertFalse(q.getValue().getFieldsObject().containsKey("metadataId"));
    }

    @Test
    void drainSetsFlagAuditsAndDoesNotTouchJobs() {
        Instant now = Instant.now();
        when(mongo.findById("a", WorkerNodeEntity.class)).thenReturn(node("a", "WORKER", now, false));
        when(mongo.find(any(Query.class), eq(ProcessingJobEntity.class))).thenReturn(List.of());

        AdminNodeDto dto = service.setDraining("a", true);
        assertEquals("DRAINING", dto.getStatus());

        ArgumentCaptor<UpdateDefinition> u = ArgumentCaptor.forClass(UpdateDefinition.class);
        verify(mongo).updateFirst(any(Query.class), u.capture(), eq(WorkerNodeEntity.class));
        assertEquals(true, ((org.bson.Document) u.getValue().getUpdateObject().get("$set")).get("draining"));
        // khong dong vao processing_jobs: job dang chay khong bi huy
        verify(mongo, never()).updateFirst(any(Query.class), any(UpdateDefinition.class), eq(ProcessingJobEntity.class));
        verify(mongo, never()).updateMulti(any(Query.class), any(UpdateDefinition.class), eq(ProcessingJobEntity.class));

        ArgumentCaptor<AuditLogEntity> a = ArgumentCaptor.forClass(AuditLogEntity.class);
        verify(auditLogRepo).save(a.capture());
        assertEquals(AuditAction.NODE_DRAINED, a.getValue().getAction());
        assertEquals(AuditActorType.ADMIN, a.getValue().getActorType());
        assertEquals(AuditTargetType.NODE, a.getValue().getTargetType());
        assertNull(a.getValue().getProjectId());
    }

    @Test
    void unknownNodeIsNotFound() {
        when(mongo.findById("x", WorkerNodeEntity.class)).thenReturn(null);
        FileBusinessException e = assertThrows(FileBusinessException.class, () -> service.setDraining("x", true));
        assertEquals(ErrorCode.NODE_NOT_FOUND, e.getErrorCode());
        verify(auditLogRepo, never()).save(any());
    }

    @Test
    void onlyWorkerCanBeDrained() {
        when(mongo.findById("api", WorkerNodeEntity.class)).thenReturn(node("api", "API", Instant.now(), false));
        FileBusinessException e = assertThrows(FileBusinessException.class, () -> service.setDraining("api", true));
        assertEquals(ErrorCode.NODE_NOT_FOUND, e.getErrorCode());
        verify(mongo, never()).updateFirst(any(Query.class), any(UpdateDefinition.class), eq(WorkerNodeEntity.class));
        verify(auditLogRepo, never()).save(any());
    }
}
