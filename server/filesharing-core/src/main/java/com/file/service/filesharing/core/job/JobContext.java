package com.file.service.filesharing.core.job;

import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;

import java.nio.file.Path;
import java.util.function.BiConsumer;
import java.util.function.Consumer;

public final class JobContext {
    private final ProcessingJobEntity job;
    private final Path workspace;
    private final String inputUrl;
    private final Path inputFile;
    private final BiConsumer<Integer, String> progress;
    private final Consumer<Process> processRegistry;

    public JobContext(ProcessingJobEntity job, Path workspace, String inputUrl, Path inputFile,
                      BiConsumer<Integer, String> progress, Consumer<Process> processRegistry) {
        this.job = job;
        this.workspace = workspace;
        this.inputUrl = inputUrl;
        this.inputFile = inputFile;
        this.progress = progress;
        this.processRegistry = processRegistry;
    }

    public ProcessingJobEntity job() {
        return job;
    }

    public String attemptId() {
        return job.getAttemptId();
    }

    // Thu muc rieng cua lan thu, runtime xoa sau khi xong
    public Path workspace() {
        return workspace;
    }

    // Chi co khi inputMode = STREAM. KHONG duoc log gia tri nay.
    public String inputUrl() {
        return inputUrl;
    }

    // Chi co khi inputMode = DOWNLOAD
    public Path inputFile() {
        return inputFile;
    }

    public void reportProgress(int percent, String step) {
        progress.accept(percent, step);
    }

    // Dang ky tien trinh con de runtime huy khi mat lease
    public void onProcessStarted(Process p) {
        processRegistry.accept(p);
    }
}
