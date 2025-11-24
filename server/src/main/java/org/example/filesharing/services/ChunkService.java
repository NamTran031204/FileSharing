package org.example.filesharing.services;

import org.example.filesharing.entities.dtos.ChunkRequest;

public interface ChunkService {
    String signUploadUrl(ChunkRequest request);
}
