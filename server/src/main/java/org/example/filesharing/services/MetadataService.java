package org.example.filesharing.services;

import org.example.filesharing.entities.dtos.MetadataDTO;

public interface MetadataService {
    void saveMetadata(MetadataDTO metadata, String uploadId);
}
