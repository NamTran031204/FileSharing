package com.file.service.filesharing.core.job;

import org.bson.types.ObjectId;

import java.net.InetAddress;

// workerId chi de quan sat. Tinh dung dan dua vao attemptId, khong dua vao workerId.
public class WorkerIdentity {
    private final String workerId;

    public WorkerIdentity() {
        String host;
        try {
            host = InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            host = "unknown";
        }
        this.workerId = host + "-" + ProcessHandle.current().pid() + "-" + new ObjectId().toHexString();
    }

    public String workerId() {
        return workerId;
    }
}
