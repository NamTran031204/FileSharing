package com.file.service.filesharing.core.job;

import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;
import com.file.service.filesharing.core.node.NodeControl;
import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.bulkhead.BulkheadConfig;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class JobDispatcherDrainTest {

    private final Bulkhead bulkhead = Bulkhead.of("t", BulkheadConfig.custom()
            .maxConcurrentCalls(2).maxWaitDuration(Duration.ZERO).build());
    private final JobStore store = mock(JobStore.class);
    private final JobRuntime runtime = mock(JobRuntime.class);
    private final NodeControl control = new NodeControl();
    private final JobDispatcher dispatcher = new JobDispatcher(bulkhead, store, runtime,
            new JobRuntimeProperties(), new WorkerIdentity(), control);

    @Test
    void drainingDoesNotClaimAndKeepsPermits() {
        control.setDraining(true);
        dispatcher.tick();
        verify(store, never()).claimOne(any(), any());
        assertEquals(2, bulkhead.getMetrics().getAvailableConcurrentCalls());
    }

    @Test
    void resumesClaimingAfterDrainOff() {
        control.setDraining(true);
        dispatcher.tick();
        control.setDraining(false);
        dispatcher.tick();
        // store tra null -> het job, nhung phai da duoc hoi
        verify(store, times(1)).claimOne(any(), any());
    }

    @Test
    void runningJobKeepsRunningWhenDrainStarts() throws Exception {
        CountDownLatch started = new CountDownLatch(1);
        CountDownLatch finish = new CountDownLatch(1);
        AtomicBoolean interrupted = new AtomicBoolean();
        AtomicBoolean completed = new AtomicBoolean();
        ProcessingJobEntity job = new ProcessingJobEntity();
        job.setJobId("j1");
        when(store.claimOne(any(), any())).thenReturn(job).thenReturn(null);
        doAnswer(i -> {
            started.countDown();
            try {
                finish.await();
                completed.set(true);
            } catch (InterruptedException e) {
                interrupted.set(true);
            }
            return null;
        }).when(runtime).run(job);

        dispatcher.tick();
        assertTrue(started.await(5, TimeUnit.SECONDS));
        control.setDraining(true);
        dispatcher.tick();
        // job moi khong duoc claim them (chi 2 lan hoi o tick dau: job + null)
        verify(store, times(2)).claimOne(any(), any());
        assertFalse(interrupted.get());
        finish.countDown();
        long end = System.currentTimeMillis() + 5000;
        while (!completed.get() && System.currentTimeMillis() < end) Thread.sleep(10);
        assertTrue(completed.get());
        assertFalse(interrupted.get());
    }
}
