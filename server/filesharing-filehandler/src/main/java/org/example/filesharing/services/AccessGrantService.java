package org.example.filesharing.services;

import org.example.filesharing.entities.dtos.access.AccessSettingsRequestDTO;
import org.example.filesharing.entities.dtos.access.GrantRequestDTO;
import org.example.filesharing.entities.dtos.access.GrantRoleRequestDTO;
import org.example.filesharing.entities.dtos.access.JoinLinkResponseDTO;
import org.example.filesharing.entities.dtos.access.LinkRequestDTO;
import org.example.filesharing.entities.dtos.access.LinkSettingsDTO;

/** Ghi grant, thanh vien project va cai dat quyen (design 6.1). type la "project" hoac "folder". */
public interface AccessGrantService {

    void addGrant(String type, String id, GrantRequestDTO request);

    void changeRole(String type, String id, String userId, GrantRoleRequestDTO request);

    /** Xoa grant cua nguoi khac can MANAGE_ACCESS; xoa cua chinh minh la tu roi (tru owner). */
    void removeGrant(String type, String id, String userId);

    void updateSettings(String type, String id, AccessSettingsRequestDTO request);

    /** Bat/sua/tat link folder; tra token (duong duy nhat tra token). */
    LinkSettingsDTO updateLink(String folderId, LinkRequestDTO request);

    /** Nguoi da dang nhap vao folder qua link: ghi grant viaLink neu chua co vai tro so huu. */
    JoinLinkResponseDTO joinLink(String token);
}
