package com.file.service.filesharing.core.job;

import com.mongodb.client.MongoChangeStreamCursor;
import com.mongodb.client.model.Aggregates;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.changestream.ChangeStreamDocument;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.util.List;
import java.util.concurrent.TimeUnit;

/** Chuong cua: moi event chi goi wakeUp(), khong doc du lieu, khong luu resume token. Vong poll van la du phong. */
@Slf4j
public class JobChangeStreamDoorbell {
    private final MongoTemplate mongo;
    private final JobDispatcher dispatcher;
    private volatile boolean running = true;
    private final Thread thread;

    public JobChangeStreamDoorbell(MongoTemplate mongo, JobDispatcher dispatcher) {
        this.mongo = mongo;
        this.dispatcher = dispatcher;
        this.thread = new Thread(this::loop, "job-doorbell");
        this.thread.setDaemon(true);
        this.thread.start();
    }

    private void loop() {
        while (running) {
            try (MongoChangeStreamCursor<ChangeStreamDocument<Document>> cursor = mongo.getCollection("processing_jobs")
                    .watch(List.of(Aggregates.match(Filters.or(
                            Filters.eq("operationType", "insert"),
                            Filters.eq("updateDescription.updatedFields.status", "PENDING")))))
                    .maxAwaitTime(1, TimeUnit.SECONDS)
                    .cursor()) {
                log.info("chuong cua change stream da ket noi");
                while (running) {
                    if (cursor.tryNext() != null) dispatcher.wakeUp();
                }
            } catch (Exception e) {
                if (!running) return;
                log.warn("chuong cua mat ket noi, thu lai sau 2s: {}", e.getMessage());
                try {
                    Thread.sleep(2000);
                } catch (InterruptedException ie) {
                    return;
                }
            }
        }
    }

    @PreDestroy
    public void stop() {
        running = false;
        thread.interrupt();
    }
}
