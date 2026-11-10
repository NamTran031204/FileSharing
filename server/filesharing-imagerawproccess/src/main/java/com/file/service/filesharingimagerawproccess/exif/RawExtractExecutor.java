package com.file.service.filesharingimagerawproccess.exif;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.file.service.filesharing.core.enums.ProcessingJobType;
import com.file.service.filesharing.core.job.InputMode;
import com.file.service.filesharing.core.job.JobContext;
import com.file.service.filesharing.core.job.JobExecution;
import com.file.service.filesharing.core.job.JobExecutor;
import com.file.service.filesharing.core.job.OutputObject;
import com.file.service.filesharing.core.job.exception.PermanentJobException;
import com.file.service.filesharing.core.job.exception.TransientJobException;
import com.file.service.filesharing.core.job.tool.ToolCommand;
import com.file.service.filesharing.core.job.tool.ToolResult;
import com.file.service.filesharing.core.job.tool.ToolRunner;
import com.file.service.filesharingimagerawproccess.config.RawProcessingConfig;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

/**
 * Worker RAW (D6): chi trich JPEG nhung bang ExifTool, khong decode/encode pixel.
 * Preview = JPEG nhung lon nhat, thumbnail = nho nhat (theo pixel roi byte); chep Orientation khi != 1.
 * Output khoa tat dinh theo objectName: thumbnail-bucket, image-preview-bucket, image-preview-bucket/<obj>.exif.json.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class RawExtractExecutor implements JobExecutor {
    static final Set<String> RAW_EXTENSIONS = Set.of("cr2", "nef", "arw");
    static final List<String> EMBEDDED_TAGS = List.of("PreviewImage", "JpgFromRaw", "ThumbnailImage", "OtherImage");
    private static final ObjectMapper JSON = new ObjectMapper();

    private final RawProcessingConfig config;
    private ExifToolSession session;

    @Value("${minio.buckets.thumbnails}")
    private String thumbnailBucket;
    @Value("${minio.buckets.image-preview}")
    private String previewBucket;
    @Value("${minio.endpoint}")
    private String minioEndpoint;

    record Candidate(Path path, long bytes, int width, int height) {
        long pixels() {
            return (long) width * height;
        }
    }

    record Pick(Candidate preview, Candidate thumb) {
    }

    @Override
    public Set<ProcessingJobType> supportedTypes() {
        return Set.of(ProcessingJobType.TRANSCODE_RAW_IMAGE);
    }

    @Override
    public InputMode inputMode() {
        return InputMode.DOWNLOAD;
    }

    // Sai EXIFTOOL_PATH thi worker khong khoi dong
    @PostConstruct
    void start() {
        String path = config.getExiftoolPath();
        if (path == null || path.isBlank()) throw new IllegalStateException("exiftool: chua cau hinh duong dan");
        try {
            ToolResult r = ToolRunner.run(ToolCommand.of("exiftool", List.of(path, "-ver"), Duration.ofSeconds(30)),
                    null, p -> { }, "-", "-");
            if (!r.ok()) throw new IllegalStateException("exiftool khong chay duoc: " + path + " (" + r.brief() + ")");
        } catch (IOException e) {
            throw new IllegalStateException("exiftool khong chay duoc: " + path + " (" + e.getMessage() + ")", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("exiftool bi ngat khi kiem: " + path, e);
        }
        session = new ExifToolSession(List.of(path), config.getCommandTimeout(), config.getLockWait());
    }

    @PreDestroy
    void stop() {
        if (session != null) session.close();
    }

    @Override
    public JobExecution process(JobContext ctx) throws PermanentJobException, TransientJobException {
        String objectName = ctx.job().getObjectName();
        int dot = objectName.lastIndexOf('.');
        String ext = dot < 0 ? "" : objectName.substring(dot + 1).toLowerCase(Locale.ROOT);
        if (!RAW_EXTENSIONS.contains(ext)) throw new PermanentJobException("dinh dang RAW khong ho tro: " + ext);
        Path src = ctx.inputFile();

        JsonNode exif;
        try (JobContext.Stage st = ctx.stage("probe", 30, 40)) {
            exif = classifyExif(exec(ctx, List.of("-json", "-n", src.toString())).stdout());
        }
        int orientation = exif.path("Orientation").asInt(1);

        Pick pick;
        try (JobContext.Stage st = ctx.stage("process", 40, 80)) {
            Path dir = ctx.workspace().resolve("embedded");
            try {
                Files.createDirectories(dir);
            } catch (IOException e) {
                throw new TransientJobException("khong tao duoc thu muc: " + e.getMessage(), e);
            }
            ctx.progress(0, "EXTRACT_EMBEDDED");
            exec(ctx, List.of("-a", "-b", "-W", dir.toString().replace('\\', '/') + "/%g1_%t%-c.%s",
                    "-preview:all", src.toString()));
            pick = pickEmbedded(candidates(ctx, dir));
            if (orientation != 1) {
                ctx.progress(0.7, "COPY_ORIENTATION");
                List<String> args = new ArrayList<>(List.of("-overwrite_original", "-tagsFromFile", src.toString(),
                        "-Orientation", pick.preview().path().toString()));
                if (!pick.thumb().path().equals(pick.preview().path())) args.add(pick.thumb().path().toString());
                exec(ctx, args);
            }
        }

        Path exifFile = ctx.workspace().resolve("exif.json");
        try {
            Files.writeString(exifFile, sanitizeExif(exif, ctx.workspace().toString()));
        } catch (IOException e) {
            throw new TransientJobException("khong ghi duoc exif.json: " + e.getMessage(), e);
        }
        int[] size = displaySize(pick.preview().width(), pick.preview().height(), orientation);
        ctx.metrics().pixels(pick.preview().pixels());
        return new JobExecution(List.of(
                new OutputObject(thumbnailBucket, objectName, pick.thumb().path(), "image/jpeg", false),
                new OutputObject(previewBucket, objectName, pick.preview().path(), "image/jpeg", false),
                new OutputObject(previewBucket, objectName + ".exif.json", exifFile, "application/json", false)),
                null, minioEndpoint + "/" + thumbnailBucket + "/" + objectName, null, size[0], size[1]);
    }

    private ExifToolSession.Result exec(JobContext ctx, List<String> args) throws PermanentJobException, TransientJobException {
        ExifToolSession.Result r = session.execute(ctx::leaseLost, args);
        ctx.metrics().add(r.tool());
        return r;
    }

    // File JPEG hop le trong thu muc trich + kich thuoc doc tu header (1 lenh cho moi file)
    private List<Candidate> candidates(JobContext ctx, Path dir) throws PermanentJobException, TransientJobException {
        List<Path> files;
        try (Stream<Path> s = Files.list(dir)) {
            files = s.filter(RawExtractExecutor::isJpeg).sorted().toList();
        } catch (IOException e) {
            throw new TransientJobException("khong doc duoc anh nhung: " + e.getMessage(), e);
        }
        if (files.isEmpty()) return List.of();
        List<String> args = new ArrayList<>(List.of("-json", "-n", "-ImageWidth", "-ImageHeight"));
        files.forEach(f -> args.add(f.toString()));
        JsonNode arr = parse(exec(ctx, args).stdout());
        Map<String, int[]> dims = new HashMap<>();
        for (JsonNode n : arr) {
            String name = Path.of(n.path("SourceFile").asText()).getFileName().toString();
            dims.put(name, new int[]{n.path("ImageWidth").asInt(0), n.path("ImageHeight").asInt(0)});
        }
        List<Candidate> out = new ArrayList<>();
        for (Path f : files) {
            int[] d = dims.getOrDefault(f.getFileName().toString(), new int[]{0, 0});
            try {
                out.add(new Candidate(f, Files.size(f), d[0], d[1]));
            } catch (IOException e) {
                throw new TransientJobException("khong doc duoc anh nhung: " + e.getMessage(), e);
            }
        }
        return out;
    }

    private static JsonNode parse(String json) throws TransientJobException {
        try {
            JsonNode n = json == null || json.isBlank() ? null : JSON.readTree(json);
            if (n == null || !n.isArray() || n.isEmpty()) throw new TransientJobException("exiftool: output JSON khong doc duoc");
            return n;
        } catch (IOException e) {
            throw new TransientJobException("exiftool: output JSON khong doc duoc");
        }
    }

    // Quy tac 3: JSON co Error hoac khong co tag anh nhung -> permanent; output hong -> transient
    static JsonNode classifyExif(String json) throws PermanentJobException, TransientJobException {
        JsonNode n = parse(json).get(0);
        if (n.hasNonNull("Error")) throw new PermanentJobException("exiftool: " + n.get("Error").asText());
        if (EMBEDDED_TAGS.stream().noneMatch(n::has)) throw new PermanentJobException("exiftool: file RAW khong co anh nhung");
        return n;
    }

    // Co tag anh nhung ma khong trich ra JPEG hop le nao -> transient (quy tac 3)
    static Pick pickEmbedded(List<Candidate> cs) throws TransientJobException {
        if (cs.isEmpty()) throw new TransientJobException("exiftool: khong trich duoc JPEG nhung hop le");
        Comparator<Candidate> bySize = Comparator.comparingLong(Candidate::pixels).thenComparingLong(Candidate::bytes);
        return new Pick(cs.stream().max(bySize).orElseThrow(), cs.stream().min(bySize).orElseThrow());
    }

    // Chi nhan file bat dau FF D8 FF va ket thuc FF D9
    static boolean isJpeg(Path p) {
        try (RandomAccessFile f = new RandomAccessFile(p.toFile(), "r")) {
            long len = f.length();
            if (len < 5) return false;
            byte[] head = new byte[3];
            f.readFully(head);
            f.seek(len - 2);
            byte[] tail = new byte[2];
            f.readFully(tail);
            return (head[0] & 0xFF) == 0xFF && (head[1] & 0xFF) == 0xD8 && (head[2] & 0xFF) == 0xFF
                    && (tail[0] & 0xFF) == 0xFF && (tail[1] & 0xFF) == 0xD9;
        } catch (IOException e) {
            return false;
        }
    }

    static int[] displaySize(int w, int h, int orientation) {
        return orientation >= 5 && orientation <= 8 ? new int[]{h, w} : new int[]{w, h};
    }

    // Bo SourceFile/Directory/FileName va moi gia tri chua duong dan workspace truoc khi upload
    static String sanitizeExif(JsonNode exif, String workspace) throws TransientJobException {
        ObjectNode o = exif.deepCopy();
        o.remove(List.of("SourceFile", "Directory", "FileName"));
        String a = workspace.replace('\\', '/');
        String b = workspace.replace('/', '\\');
        for (Iterator<Map.Entry<String, JsonNode>> it = o.fields(); it.hasNext(); ) {
            JsonNode v = it.next().getValue();
            if (v.isTextual() && (v.asText().contains(a) || v.asText().contains(b))) it.remove();
        }
        try {
            return JSON.writerWithDefaultPrettyPrinter().writeValueAsString(o);
        } catch (IOException e) {
            throw new TransientJobException("khong ghi duoc exif.json: " + e.getMessage(), e);
        }
    }
}
