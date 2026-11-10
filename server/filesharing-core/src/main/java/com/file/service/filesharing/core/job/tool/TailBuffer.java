package com.file.service.filesharing.core.job.tool;

import java.util.ArrayDeque;
import java.util.List;

// Giu N dong cuoi, thread-safe
public final class TailBuffer {
    private final int max;
    private final ArrayDeque<String> lines = new ArrayDeque<>();

    public TailBuffer(int max) {
        this.max = max;
    }

    public synchronized void add(String line) {
        if (lines.size() == max) lines.removeFirst();
        lines.addLast(line);
    }

    public synchronized List<String> lines() {
        return List.copyOf(lines);
    }
}
