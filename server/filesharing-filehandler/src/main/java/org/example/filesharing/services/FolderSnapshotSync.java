package org.example.filesharing.services;

import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.enums.permission.GrantedProjectRole;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.example.filesharing.utils.ProjectPermissionResolver;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import java.util.Objects;

/**
 * Dong bo snapshot userPermissions cua moi folder trong project khi thanh vien bi xoa hoac doi vai tro.
 * Ghi hang loat bang updateMulti, ke ca folder trong thung rac; khong bao gio dong vao muc cua owner project.
 */
@Component
@RequiredArgsConstructor
public class FolderSnapshotSync {

    private final MongoTemplate mongoTemplate;

    public void removeUser(String projectId, String userId, String ownerId) {
        if (userId == null || Objects.equals(userId, ownerId)) {
            return;
        }
        mongoTemplate.updateMulti(foldersHolding(projectId, userId),
                new Update().pull("userPermissions", new Document("userId", userId)),
                FolderEntity.class);
    }

    // chi doi tap quyen cua cac muc da co, khong them muc moi, giu isPrivateCollaborator va grantedAt
    public void resetRole(String projectId, String userId, GrantedProjectRole role, String ownerId) {
        if (userId == null || Objects.equals(userId, ownerId)) {
            return;
        }
        var permissions = ProjectPermissionResolver.buildSingleEntry(userId, role, false).getPermissions();
        mongoTemplate.updateMulti(foldersHolding(projectId, userId),
                new Update().set("userPermissions.$[e].permissions", permissions)
                        .filterArray(Criteria.where("e.userId").is(userId)),
                FolderEntity.class);
    }

    private static Query foldersHolding(String projectId, String userId) {
        return Query.query(Criteria.where("projectId").is(projectId).and("userPermissions.userId").is(userId));
    }
}
