package com.file.service.filesharing.core.entity.models;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

/**
 * So hien dien cua moi service (khong phai nguon chan ly: job do ai chay van la processing_jobs.workerId).
 * Doc bi TTL xoa khi lastSeenAt qua han; node song lai thi upsert tao moi voi draining=false.
 */
@Document(collection = "worker_nodes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkerNodeEntity {
    @Id
    private String nodeId;

    private String service;
    /** WORKER | API | NOTIFICATION */
    private String kind;
    private String host;
    private Long pid;
    private Integer cores;
    private Instant startedAt;
    private Instant lastSeenAt;
    private Cpu cpu;
    private Memory memory;
    private Long workspaceFreeBytes;
    /** chi co khi service la worker */
    private Worker worker;
    private Boolean draining;
    private List<Sample> samples;

    /** moi gia tri 0..1 cua ca may; children = null khi khong do duoc tien trinh con */
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Cpu {
        private Double system;
        private Double process;
        private Double children;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Memory {
        private Long heapUsed;
        private Long heapMax;
        private Long systemTotal;
        private Long systemFree;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Worker {
        private List<String> jobTypes;
        private String bulkheadName;
        private Integer maxConcurrent;
        private Integer inUse;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Sample {
        private Instant t;
        private Double sys;
        private Double proc;
        private Double child;
        private Long heap;
    }
}
