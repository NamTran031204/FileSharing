package org.example.filesharing.entities.models;

import com.file.service.filesharing.core.entity.models.base.EntityAuditBase;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

/**
 * Nhom quyen quan tri (role dong). Khong co co active: muon tat thi go quyen hoac xoa nhom.
 * Audit (createdAt/By, updatedAt/By) ke thua tu EntityAuditBase.
 */
@Document(collection = "admin_roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class AdminRoleEntity extends EntityAuditBase {
    @Id
    private String id;

    // unique (index), regex ^[A-Za-z0-9_.-]{1,100}$ kiem o DTO
    private String code;

    private String name;

    private String description;

    // ten permission thuoc AdminPermission, luu dang tap da sap xep
    @Builder.Default
    private List<String> permissions = new ArrayList<>();
}
