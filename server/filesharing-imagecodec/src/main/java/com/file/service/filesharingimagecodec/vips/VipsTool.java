package com.file.service.filesharingimagecodec.vips;

import com.file.service.filesharing.core.job.JobContext;
import com.file.service.filesharing.core.job.exception.PermanentJobException;
import com.file.service.filesharing.core.job.exception.TransientJobException;
import com.file.service.filesharing.core.job.tool.LineParser;
import com.file.service.filesharing.core.job.tool.ToolCommand;
import com.file.service.filesharing.core.job.tool.ToolResult;
import com.file.service.filesharing.core.job.tool.ToolRunner;
import com.file.service.filesharingimagecodec.config.ImageProcessingConfig;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiConsumer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * libvips CLI cho anh thuong (D1): PROBE bang vipsheader -a, PROCESS bang 2 lan vips thumbnail ra WebP (RES 2.10).
 * Loader "untrusted" bi chan (VIPS_BLOCK_UNTRUSTED), loader phai thuoc allowlist. Khong ImageIO, khong FFmpeg.
 */
public final class VipsTool {
    private static final Pattern PROGRESS = Pattern.compile(": (\\d+)% complete$");

    public record Header(int width, int height, String loader, int orientation) {
    }

    private final ImageProcessingConfig.VipsConfig vips;
    private final ImageProcessingConfig.OutputConfig output;

    public VipsTool(ImageProcessingConfig cfg) {
        this.vips = cfg.getVips();
        this.output = cfg.getOutput();
    }

    // Sai duong dan cong cu thi worker khong khoi dong
    public void verify() {
        verify("vips", vips.getPath());
        verify("vipsheader", vips.getHeaderPath());
    }

    private static void verify(String tool, String path) {
        if (path == null || path.isBlank()) throw new IllegalStateException(tool + ": chua cau hinh duong dan");
        try {
            ToolResult r = ToolRunner.run(ToolCommand.of(tool, List.of(path, "--version"), Duration.ofSeconds(30)),
                    null, p -> { }, "-", "-");
            if (!r.ok()) throw new IllegalStateException(tool + " khong chay duoc: " + path + " (" + r.brief() + ")");
        } catch (IOException e) {
            throw new IllegalStateException(tool + " khong chay duoc: " + path + " (" + e.getMessage() + ")", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(tool + " bi ngat khi kiem: " + path, e);
        }
    }

    private Map<String, String> env() {
        Map<String, String> env = new HashMap<>();
        env.put("VIPS_BLOCK_UNTRUSTED", "1");
        env.put("VIPS_CONCURRENCY", String.valueOf(vips.getConcurrency()));
        return env;
    }

    private Duration timeout() {
        return Duration.ofSeconds(vips.getProcessingTimeoutSeconds());
    }

    public Header probe(JobContext ctx, Path input) throws PermanentJobException, TransientJobException {
        StringBuilder out = new StringBuilder();
        ToolResult r = ctx.exec(new ToolCommand("vipsheader", List.of(vips.getHeaderPath(), "-a", input.toString()),
                timeout(), List.of(), env(), (stderr, line) -> {
                    if (!stderr && out.length() < 256 * 1024) out.append(line).append('\n');
                }));
        return classify(r, out.toString(), vips.getMaxPixels(), vips.getAllowedLoaders());
    }

    static Header classify(ToolResult r, String stdout, long maxPixels, List<String> allowedLoaders)
            throws PermanentJobException, TransientJobException {
        // Quy tac 2: PROBE khong chay xong thi transient, xet truoc exit code
        if (r.timedOut() || r.killed()) throw new TransientJobException(r.brief(), r.detail());
        // File da tai du byte (runtime kiem) ma vipsheader khong doc duoc: dinh dang khong ho tro hoac file hong
        if (r.exitCode() != 0) {
            throw new PermanentJobException("vipsheader: dinh dang khong ho tro hoac file hong (exit " + r.exitCode() + ")",
                    r.detail());
        }
        Header h = parse(stdout);
        if (h == null) throw new TransientJobException("vipsheader: output khong doc duoc", r.detail());
        if (allowedLoaders == null || !allowedLoaders.contains(h.loader())) {
            throw new PermanentJobException("dinh dang anh khong ho tro (loader " + h.loader() + ")", r.detail());
        }
        long pixels = (long) h.width() * h.height();
        if (maxPixels > 0 && pixels > maxPixels) {
            throw new PermanentJobException("anh qua lon: " + pixels + " pixel, toi da " + maxPixels);
        }
        return h;
    }

    private static Header parse(String stdout) {
        Map<String, String> kv = new HashMap<>();
        for (String line : stdout.split("\n")) {
            int i = line.indexOf(": ");
            if (i > 0) kv.putIfAbsent(line.substring(0, i).trim(), line.substring(i + 2).trim());
        }
        try {
            int w = Integer.parseInt(kv.get("width"));
            int h = Integer.parseInt(kv.get("height"));
            String loader = kv.get("vips-loader");
            if (loader == null || loader.isBlank()) return null;
            String o = kv.get("orientation");
            return new Header(w, h, loader, o == null ? 1 : Integer.parseInt(o.split(" ")[0]));
        } catch (RuntimeException e) {
            return null;
        }
    }

    // Kich thuoc sau xoay EXIF: Orientation 5-8 la xoay 90/270 do
    static int[] displaySize(Header h) {
        return h.orientation() >= 5 && h.orientation() <= 8
                ? new int[]{h.height(), h.width()} : new int[]{h.width(), h.height()};
    }

    // --vips-progress in "...: N% complete" ra stdout; quy ve phan [from, to] cua chang PROCESS
    static LineParser progressParser(double from, double to, String step, BiConsumer<Double, String> progress) {
        return (stderr, line) -> {
            if (stderr) return;
            Matcher m = PROGRESS.matcher(line);
            if (m.find()) {
                int pct = Integer.parseInt(m.group(1));
                progress.accept(from + (to - from) * pct / 100.0, step + " " + pct + "%");
            }
        };
    }

    // Preview: canh dai <= previewMaxEdge, khong phong to, WebP Q/effort, doi ve sRGB, bo metadata (RES 2.10)
    public void preview(JobContext ctx, Path input, Path out) throws TransientJobException {
        String target = out + "[Q=" + output.getWebpQuality() + ",effort=" + output.getWebpEffort() + ",keep=none]";
        run(ctx, List.of(vips.getPath(), "thumbnail", input.toString(), target, String.valueOf(output.getPreviewMaxEdge()),
                "--size", "down", "--export-profile", "srgb", "--vips-progress"), out,
                progressParser(0.0, 0.9, "PREVIEW", ctx::progress));
    }

    // Thumbnail: rong thumbnailWidth (chieu cao tu do), khong phong to
    public void thumbnail(JobContext ctx, Path input, Path out) throws TransientJobException {
        String target = out + "[Q=" + output.getWebpQuality() + ",keep=none]";
        run(ctx, List.of(vips.getPath(), "thumbnail", input.toString(), target, String.valueOf(output.getThumbnailWidth()),
                "--height", "100000", "--size", "down", "--export-profile", "srgb", "--vips-progress"), out,
                progressParser(0.9, 1.0, "THUMB", ctx::progress));
    }

    private void run(JobContext ctx, List<String> cmd, Path out, LineParser parser) throws TransientJobException {
        ToolResult r = ctx.exec(new ToolCommand("vips", cmd, timeout(), List.of(), env(), parser));
        // Sau PROBE thanh cong: timeout, exit != 0, output thieu/0 byte deu transient (quy tac 6)
        if (!r.ok()) throw new TransientJobException(r.brief(), r.detail());
        try {
            if (!Files.exists(out) || Files.size(out) == 0) throw new TransientJobException("vips: output thieu hoac 0 byte");
        } catch (IOException e) {
            throw new TransientJobException("vips: khong doc duoc output: " + e.getMessage(), e);
        }
    }
}
