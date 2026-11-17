package org.example.filesharing.services;

import org.example.filesharing.entities.dtos.admin.AdminNodeDto;

import java.util.List;

public interface AdminNodeService {

    List<AdminNodeDto> getAll();

    /** chi node kind=WORKER; node khong ton tai hoac khong phai worker thi NODE_NOT_FOUND */
    AdminNodeDto setDraining(String nodeId, boolean draining);
}
