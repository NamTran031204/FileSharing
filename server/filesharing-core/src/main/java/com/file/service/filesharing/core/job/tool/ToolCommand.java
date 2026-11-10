package com.file.service.filesharing.core.job.tool;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Mot lenh cong cu ngoai. secrets: chuoi phai che trong log/duoi stderr (vi du presigned URL).
 * env: bien moi truong rieng cua lenh, cong them vao whitelist cua ToolRunner. parser co the null.
 */
public record ToolCommand(String tool, List<String> args, Duration timeout, List<String> secrets,
                          Map<String, String> env, LineParser parser) {
    public ToolCommand {
        args = List.copyOf(args);
        secrets = secrets == null ? List.of() : secrets.stream().filter(s -> s != null && !s.isEmpty()).toList();
        env = env == null ? Map.of() : Map.copyOf(env);
    }

    public static ToolCommand of(String tool, List<String> args, Duration timeout) {
        return new ToolCommand(tool, args, timeout, List.of(), Map.of(), null);
    }
}
