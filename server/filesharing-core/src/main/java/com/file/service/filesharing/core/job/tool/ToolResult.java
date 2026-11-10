package com.file.service.filesharing.core.job.tool;

import java.util.ArrayList;
import java.util.List;

/**
 * Ket qua 1 lan chay cong cu. tail = cac dong stderr cuoi da che bi mat. killed = ToolRunner da huy tien trinh
 * (timeout, interrupt, hoac con song khi ket thuc). ToolRunner KHONG phan loai loi, wrapper cua tung cong cu quyet dinh.
 */
public record ToolResult(String tool, int exitCode, boolean timedOut, boolean killed, long wallMs, Long cpuMs,
                         List<String> tail) {
    public static final int MAX_DETAIL = 1500;

    public boolean ok() {
        return !timedOut && !killed && exitCode == 0;
    }

    // Thong diep ngan, khong co dong stderr: di vao lastError/result.errorMessage va toi client
    public String brief() {
        if (timedOut) return tool + ": timeout " + Math.max(1, wallMs / 1000) + "s";
        return tool + ": exit " + exitCode;
    }

    // Duoi stderr <= MAX_DETAIL ky tu, bo dong cu nhat truoc. Chi vao errorHistory[].detail
    public String detail() {
        List<String> kept = new ArrayList<>();
        int len = 0;
        for (int i = tail.size() - 1; i >= 0; i--) {
            String line = tail.get(i);
            int add = line.length() + (kept.isEmpty() ? 0 : 1);
            if (len + add > MAX_DETAIL) {
                if (kept.isEmpty()) kept.add(line.substring(line.length() - MAX_DETAIL));
                break;
            }
            kept.add(0, line);
            len += add;
        }
        return String.join("\n", kept);
    }
}
