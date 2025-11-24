package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.ChunkRequest;
import org.example.filesharing.services.ChunkService;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChunkServiceImpl implements ChunkService {

    @Override
    public String signUploadUrl(ChunkRequest request) {
        return null;
    }
}
