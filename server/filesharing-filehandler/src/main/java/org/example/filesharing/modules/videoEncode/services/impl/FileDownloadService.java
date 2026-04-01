package org.example.filesharing.modules.videoEncode.services.impl;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.services.MinIoService;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FileDownloadService {
    private final MinIoService minIoService;

    public void downloadFile(String objectName) {

    }
}
