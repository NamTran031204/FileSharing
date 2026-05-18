package org.example.filesharing.services.baseService;

import org.example.filesharing.entities.models.base.EntityAuditBase;
import org.example.filesharing.services.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class BaseAuditService<T extends EntityAuditBase> {
    @Autowired
    private AuditService auditService;

    protected void buildAudit(T model, Boolean isCreateNew) {
        model.setIsActive(true);
        model.setIsTrash(false);

        if (isCreateNew) {
            createAudit(model);
        } else {
            updateAudit(model);
        }
    }

    protected void moveToTrashAudit(T model) {
        model.setIsTrash(true);
        model.setTrashedAt(Instant.now());

        model.setUpdateBy(auditService.getCurrentUserId());
        model.setUpdateByEmail(auditService.getCurrentUserEmail());
    }

    protected void softDeleteAudit(T model) {
        model.setIsActive(false);

        updateAudit(model);
    }

    protected void restoreTrashAudit(T model) {
        model.setIsTrash(false);
        model.setTrashedAt(null);

        updateAudit(model);
    }

    protected void undoDeleteAudit(T model) {
        model.setIsActive(true);

        updateAudit(model);
    }

    protected void createAudit(T model) {
        model.setCreatedBy(auditService.getCurrentUserId());
        model.setCreatedByEmail(auditService.getCurrentUserEmail());
        model.setCreatedAt(Instant.now());
    }

    protected void updateAudit(T model) {
        model.setUpdateBy(auditService.getCurrentUserId());
        model.setUpdateByEmail(auditService.getCurrentUserEmail());
        model.setUpdatedAt(Instant.now());
    }
}
