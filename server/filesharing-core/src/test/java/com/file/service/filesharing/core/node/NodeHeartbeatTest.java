package com.file.service.filesharing.core.node;

import com.file.service.filesharing.core.entity.models.WorkerNodeEntity;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.UpdateDefinition;

import java.time.Duration;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class NodeHeartbeatTest {

    private final MongoTemplate mongo = mock(MongoTemplate.class);
    private final NodeControl control = new NodeControl();
    private final NodeHeartbeat hb = new NodeHeartbeat(mongo, control, "n1", "filesharing-videocodec", "WORKER",
            Duration.ofSeconds(5), () -> new WorkerNodeEntity.Worker(java.util.List.of("X"), "b", 2, 1));

    @Test
    void upsertsSlicedSamplesAndKeepsDrainingOnInsertOnly() {
        WorkerNodeEntity doc = new WorkerNodeEntity();
        doc.setDraining(true);
        when(mongo.findAndModify(any(Query.class), any(UpdateDefinition.class), any(FindAndModifyOptions.class),
                eq(WorkerNodeEntity.class))).thenReturn(doc);
        hb.beat();

        ArgumentCaptor<UpdateDefinition> cap = ArgumentCaptor.forClass(UpdateDefinition.class);
        verify(mongo).findAndModify(any(Query.class), cap.capture(), any(FindAndModifyOptions.class),
                eq(WorkerNodeEntity.class));
        Document u = cap.getValue().getUpdateObject();
        var push = (org.springframework.data.mongodb.core.query.Update.Modifiers) ((Document) u.get("$push")).get("samples");
        assertTrue(push.getModifiers().stream().anyMatch(m -> "$slice".equals(m.getKey()) && Integer.valueOf(-120).equals(m.getValue())));
        Document set = (Document) u.get("$set");
        assertFalse(set.containsKey("draining"));
        assertEquals(false, ((Document) u.get("$setOnInsert")).get("draining"));
        assertEquals("WORKER", set.get("kind"));
        assertTrue(control.isDraining());
        assertTrue(set.get("lastSeenAt") instanceof Instant);
    }

    @Test
    void mongoFailureDoesNotThrow() {
        when(mongo.findAndModify(any(Query.class), any(UpdateDefinition.class), any(FindAndModifyOptions.class),
                eq(WorkerNodeEntity.class))).thenThrow(new IllegalStateException("mat ket noi"));
        assertDoesNotThrow(hb::beat);
        assertFalse(control.isDraining());
    }

    @Test
    void statusStaleAfter15sAndDrainingOnlyWhenFresh() {
        Instant now = Instant.now();
        assertEquals(NodeStatus.ONLINE, NodeStatus.of(now.minusSeconds(14), false, now));
        assertEquals(NodeStatus.STALE, NodeStatus.of(now.minusSeconds(16), false, now));
        assertEquals(NodeStatus.DRAINING, NodeStatus.of(now.minusSeconds(3), true, now));
        assertEquals(NodeStatus.STALE, NodeStatus.of(now.minusSeconds(30), true, now));
        assertEquals(NodeStatus.STALE, NodeStatus.of(null, false, now));
    }
}
