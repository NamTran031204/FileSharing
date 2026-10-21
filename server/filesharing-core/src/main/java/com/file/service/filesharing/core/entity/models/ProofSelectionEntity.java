package com.file.service.filesharing.core.entity.models;

import com.file.service.filesharing.core.entity.models.base.EntityAuditBase;
import com.file.service.filesharing.core.enums.ProofSelectionStatus;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "proof_selection")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class ProofSelectionEntity extends EntityAuditBase {
    @Id
    private String selectionId;

    private String projectId;
    private String folderId;

    private String guestName;
    // SHA-256 hex cua guestKey, khong luu guestKey
    private String guestKeyHash;

    private List<String> assetIds;
    private ProofSelectionStatus status;
    private String note;
    private Instant submittedAt;
}
