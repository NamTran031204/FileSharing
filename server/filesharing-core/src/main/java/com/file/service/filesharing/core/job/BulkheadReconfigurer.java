package com.file.service.filesharing.core.job;

import com.file.service.filesharing.core.setting.RuntimeSettings;
import com.file.service.filesharing.core.setting.SettingKey;
import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.bulkhead.BulkheadConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;

import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.IntSupplier;

/**
 * Dua so slot bulkhead ve gia tri setting worker.bulkhead.NAME.max-concurrent theo chu ky ngan.
 * Bulkhead.changeConfig khong huy job dang chay: tang thi them permit, giam thi chi chan permit moi
 * (permit dang giu duoc tra dan trong finally cua job).
 * Luu y: Bulkhead.changeConfig khi giam se CHO cho du permit trong (chan thread goi), nen giam duoc chay
 * tren thread rieng de khong chan scheduler dung chung voi poll job; trong luc cho, sync bo qua.
 */
@Slf4j
public class BulkheadReconfigurer {
    private final Bulkhead bulkhead;
    private final IntSupplier desired;
    private final AtomicBoolean shrinking = new AtomicBoolean();

    public BulkheadReconfigurer(Bulkhead bulkhead, IntSupplier desired) {
        this.bulkhead = bulkhead;
        this.desired = desired;
    }

    public static BulkheadReconfigurer of(Bulkhead bulkhead, String name, RuntimeSettings settings) {
        SettingKey key = SettingKey.forBulkhead(name);
        // ten khong co trong catalogue thi giu nguyen cau hinh hien tai
        IntSupplier desired = key == null ? () -> bulkhead.getBulkheadConfig().getMaxConcurrentCalls()
                : () -> settings.intValue(key);
        return new BulkheadReconfigurer(bulkhead, desired);
    }

    // Doc setting trong bo nho nen chu ky 1s re; do tre toi da = chu ky refresh cua RuntimeSettings + 1s
    @Scheduled(fixedDelayString = "${job-runtime.bulkhead-sync-interval:1s}")
    public void sync() {
        if (shrinking.get()) return;
        try {
            int want = desired.getAsInt();
            BulkheadConfig cur = bulkhead.getBulkheadConfig();
            int now = cur.getMaxConcurrentCalls();
            if (want < 1 || want == now) return;
            BulkheadConfig next = BulkheadConfig.from(cur).maxConcurrentCalls(want).build();
            if (want > now) {
                bulkhead.changeConfig(next);
                log.info("bulkhead {} doi max-concurrent {} -> {}", bulkhead.getName(), now, want);
            } else if (shrinking.compareAndSet(false, true)) {
                Thread t = new Thread(() -> {
                    try {
                        bulkhead.changeConfig(next);
                        log.info("bulkhead {} doi max-concurrent {} -> {}", bulkhead.getName(), now, want);
                    } catch (RuntimeException e) {
                        log.warn("giam bulkhead loi: {}", e.getClass().getSimpleName());
                    } finally {
                        shrinking.set(false);
                    }
                }, "bulkhead-shrink-" + bulkhead.getName());
                t.setDaemon(true);
                t.start();
            }
        } catch (RuntimeException e) {
            log.warn("dong bo bulkhead loi: {}", e.getClass().getSimpleName());
        }
    }
}
