package org.example.filesharing.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
public class SseService {

    private final Map<String, CopyOnWriteArrayList<SseEmitter>> folderEmitters = new ConcurrentHashMap<>();
    private final Map<String, CopyOnWriteArrayList<SseEmitter>> annotationEmitters = new ConcurrentHashMap<>();

    // ── Folder asset-status SSE ───────────────────────────────────────────────

    public SseEmitter subscribe(String folderId) {
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L); // 30 min timeout

        folderEmitters.computeIfAbsent(folderId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        Runnable cleanup = () -> {
            CopyOnWriteArrayList<SseEmitter> list = folderEmitters.get(folderId);
            if (list != null) {
                list.remove(emitter);
                if (list.isEmpty()) folderEmitters.remove(folderId);
            }
        };

        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        return emitter;
    }

    public void sendAssetStatusUpdate(String folderId, Object data) {
        CopyOnWriteArrayList<SseEmitter> emitters = folderEmitters.get(folderId);
        if (emitters == null || emitters.isEmpty()) return;

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("asset-status").data(data));
            } catch (IOException e) {
                log.debug("SSE emitter dead for folder {}, removing", folderId);
                emitters.remove(emitter);
            }
        }
    }

    // ── Annotation realtime SSE ───────────────────────────────────────────────

    /**
     * Subscribe to realtime annotation events for a given asset.
     * Timeout 30 minutes — client should reconnect if needed.
     */
    public SseEmitter subscribeToAnnotation(String assetId) {
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);

        annotationEmitters.computeIfAbsent(assetId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        Runnable cleanup = () -> removeAnnotationEmitter(assetId, emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        return emitter;
    }

    /**
     * Broadcast an annotation event to all subscribers of the given asset.
     * Called from AnnotationsServiceImpl after each mutation (create/edit/resolve/reopen/delete).
     */
    public void publishAnnotationEvent(String assetId, Object eventData) {
        if (assetId == null) return;
        CopyOnWriteArrayList<SseEmitter> emitters = annotationEmitters.get(assetId);
        if (emitters == null || emitters.isEmpty()) {
            log.info("[SSE] No subscribers for assetId={}, event dropped", assetId);
            return;
        }

        log.info("[SSE] Broadcasting annotation event to assetId={}, subscribers={}", assetId, emitters.size());
        List<SseEmitter> dead = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("annotation-update").data(eventData));
            } catch (IOException e) {
                log.info("[SSE] Dead emitter for assetId={}, removing", assetId);
                dead.add(emitter);
            } catch (Exception e) {
                log.warn("[SSE] Unexpected error for assetId={}", assetId, e);
                dead.add(emitter);
            }
        }
        emitters.removeAll(dead);
    }

    private void removeAnnotationEmitter(String assetId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> list = annotationEmitters.get(assetId);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) annotationEmitters.remove(assetId);
        }
    }
}
