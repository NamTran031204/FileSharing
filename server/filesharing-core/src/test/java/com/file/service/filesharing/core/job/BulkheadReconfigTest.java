package com.file.service.filesharing.core.job;

import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.bulkhead.BulkheadConfig;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

class BulkheadReconfigTest {

    private final AtomicInteger want = new AtomicInteger(2);
    private final Bulkhead bulkhead = Bulkhead.of("t", BulkheadConfig.custom()
            .maxConcurrentCalls(2).maxWaitDuration(Duration.ZERO).build());
    private final BulkheadReconfigurer reconf = new BulkheadReconfigurer(bulkhead, want::get);

    @Test
    void raiseAddsSlotsImmediately() {
        assertTrue(bulkhead.tryAcquirePermission());
        assertTrue(bulkhead.tryAcquirePermission());
        assertFalse(bulkhead.tryAcquirePermission());
        want.set(4);
        reconf.sync();
        assertEquals(4, bulkhead.getBulkheadConfig().getMaxConcurrentCalls());
        assertTrue(bulkhead.tryAcquirePermission());
        assertTrue(bulkhead.tryAcquirePermission());
        assertFalse(bulkhead.tryAcquirePermission());
    }

    @Test
    void lowerBlocksNewPermitsButDoesNotInterruptRunningJob() throws Exception {
        CountDownLatch started = new CountDownLatch(2);
        CountDownLatch finish = new CountDownLatch(1);
        AtomicBoolean interrupted = new AtomicBoolean();
        AtomicBoolean completed = new AtomicBoolean();
        // hai "job" dang chay, moi job giu 1 permit giong JobDispatcher
        for (int i = 0; i < 2; i++) {
            assertTrue(bulkhead.tryAcquirePermission());
            Thread.ofVirtual().start(() -> {
                try {
                    started.countDown();
                    finish.await();
                    completed.set(true);
                } catch (InterruptedException e) {
                    interrupted.set(true);
                } finally {
                    bulkhead.releasePermission();
                }
            });
        }
        assertTrue(started.await(5, TimeUnit.SECONDS));

        want.set(1);
        reconf.sync();
        // sync khong chan thread goi du changeConfig phai cho job tra permit
        // dang giu 2 > 1: khong cap them, job khong bi ngat
        assertFalse(bulkhead.tryAcquirePermission());
        assertFalse(interrupted.get());

        finish.countDown();
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
        while (bulkhead.getBulkheadConfig().getMaxConcurrentCalls() != 1 && System.nanoTime() < deadline) {
            Thread.sleep(10);
        }
        assertEquals(1, bulkhead.getBulkheadConfig().getMaxConcurrentCalls());
        assertTrue(completed.get());
        assertFalse(interrupted.get());
        // job xong het: con dung 1 slot theo cau hinh moi
        assertTrue(bulkhead.tryAcquirePermission());
        assertFalse(bulkhead.tryAcquirePermission());
    }

    @Test
    void invalidOrSameValueIsIgnored() {
        want.set(0);
        reconf.sync();
        assertEquals(2, bulkhead.getBulkheadConfig().getMaxConcurrentCalls());
        want.set(2);
        reconf.sync();
        assertEquals(2, bulkhead.getBulkheadConfig().getMaxConcurrentCalls());
    }
}
