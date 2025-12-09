package org.example.filesharing.services;

import org.example.filesharing.entities.dtos.chunk.ChunkRequest;

public interface ChunkService {
    String completeSave(ChunkRequest request);
}
