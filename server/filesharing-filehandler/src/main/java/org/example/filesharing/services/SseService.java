package org.example.filesharing.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
public class SseService {

    private final Map<String, CopyOnWriteArrayList<SseEmitter>> folderEmitters = new ConcurrentHashMap<>();

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
}
