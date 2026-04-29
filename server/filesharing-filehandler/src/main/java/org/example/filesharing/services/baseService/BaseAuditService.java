package org.example.filesharing.services.baseService;

import org.example.filesharing.entities.models.core.base.EntityAuditBase;
import org.example.filesharing.services.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BaseAuditService<T extends EntityAuditBase> {
    @Autowired
    private AuditService auditService;

    protected void buildAudit(T model, Boolean isCreateNew) {
        model.setIsActive(true);

        if (isCreateNew) {
            model.setCreatedBy(auditService.getCurrentUserId());
            model.setCreatedByEmail(auditService.getCurrentUserEmail());
        } else {
            model.setUpdateBy(auditService.getCurrentUserId());
            model.setUpdateByEmail(auditService.getCurrentUserEmail());
        }
    }
}
