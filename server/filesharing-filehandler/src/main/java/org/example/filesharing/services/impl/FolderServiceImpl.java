package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.folder.FolderCreateRequestDTO;
import org.example.filesharing.entities.dtos.folder.FolderFilterRequestDTO;
import org.example.filesharing.entities.dtos.folder.FolderUpdateRequestDTO;
import org.example.filesharing.entities.models.core.FolderEntity;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.exceptions.specException.FileBusinessException;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.repositories.FolderRepo;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.services.FolderService;
import org.example.filesharing.services.baseService.BaseAuditService;
import org.example.filesharing.utils.StringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FolderServiceImpl extends BaseAuditService<FolderEntity> implements FolderService {

    private final FolderRepo folderRepo;
    private final ProjectRepo projectRepo;
    private final AssetRepo assetRepo;
    private final MongoTemplate mongoTemplate;

    @Override
    @Transactional
    public FolderEntity createNewFolder(FolderCreateRequestDTO request) {
        if (!projectRepo.existsById(request.getProjectId())) {
            throw new FileBusinessException(ErrorCode.PROJECT_NOT_FOUND);
        }

        folderRepo.findByProjectIdAndParentFolderIdAndFolderName(
                request.getProjectId(), request.getParentFolderId(), request.getFolderName())
                .ifPresent(f -> {
                    throw new FileBusinessException(ErrorCode.FOLDER_ALREADY_EXISTS);
                });

        String folderPath = "/";
        int level = 0;

        if (!StringUtils.isNullOrEmpty(request.getParentFolderId())) {
            FolderEntity parent = folderRepo.findById(request.getParentFolderId())
                    .orElseThrow(() -> new FileBusinessException(ErrorCode.FOLDER_PARENT_NOT_FOUND));
            folderPath = parent.getFolderPath() + parent.getFolderName() + "/";
            level = parent.getLevel() + 1;
        }

        FolderEntity folder = FolderEntity.builder()
                .projectId(request.getProjectId())
                .parentFolderId(request.getParentFolderId())
                .folderName(request.getFolderName())
                .description(request.getDescription())
                .folderPath(folderPath)
                .level(level)
                .build();

        buildAudit(folder, true);
        return folderRepo.save(folder);
    }

    @Override
    @Transactional
    public FolderEntity updateFolderDetail(FolderUpdateRequestDTO request) {
        FolderEntity folder = folderRepo.findById(request.getFolderId())
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FOLDER_NOT_FOUND));

        if (!StringUtils.isNullOrEmpty(request.getFolderName()) && !request.getFolderName().equals(folder.getFolderName())) {
            folderRepo.findByProjectIdAndParentFolderIdAndFolderName(
                    folder.getProjectId(), folder.getParentFolderId(), request.getFolderName())
                    .ifPresent(f -> {
                        throw new FileBusinessException(ErrorCode.FOLDER_ALREADY_EXISTS);
                    });

            String oldPathWithSelf = folder.getFolderPath() + folder.getFolderName() + "/";
            String newPathWithSelf = folder.getFolderPath() + request.getFolderName() + "/";

            List<FolderEntity> children = folderRepo.findByFolderPathStartingWith(oldPathWithSelf);
            for (FolderEntity child : children) {
                String updatedPath = child.getFolderPath().replaceFirst(oldPathWithSelf, newPathWithSelf);
                child.setFolderPath(updatedPath);
            }
            folderRepo.saveAll(children);
            
            folder.setFolderName(request.getFolderName());
        }

        if (request.getDescription() != null) {
            folder.setDescription(request.getDescription());
        }
        
        if (request.getIsActive() != null) {
            folder.setIsActive(request.getIsActive());
        }

        buildAudit(folder, false);

        return folderRepo.save(folder);
    }

    @Override
    public FolderEntity getFolderById(String folderId) {
        return folderRepo.findById(folderId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FOLDER_NOT_FOUND));
    }

    @Override
    public PageResult<FolderEntity> getFolderPage(PageRequestDto<FolderFilterRequestDTO> dto) {
        Query query = new Query();
        FolderFilterRequestDTO filter = dto.getFilter();
        
        if (filter != null) {
            if (!StringUtils.isNullOrEmpty(filter.getProjectId())) {
                query.addCriteria(Criteria.where("projectId").is(filter.getProjectId()));
            }
            if (filter.getParentFolderId() != null) {
                query.addCriteria(Criteria.where("parentFolderId").is(filter.getParentFolderId()));
            }
            if (!StringUtils.isNullOrEmpty(filter.getFolderName())) {
                query.addCriteria(Criteria.where("folderName").regex(filter.getFolderName(), "i"));
            }
            if (filter.getIsActive() != null) {
                query.addCriteria(Criteria.where("isActive").is(filter.getIsActive()));
            }
        }

        long total = mongoTemplate.count(query, FolderEntity.class);
        query.with(dto.getPageRequest());
        List<FolderEntity> data = mongoTemplate.find(query, FolderEntity.class);

        return PageResult.<FolderEntity>builder()
                .totalCount(total)
                .data(data)
                .build();
    }

    @Override
    @Transactional
    public void deleteFolder(String folderId) {
        FolderEntity folder = folderRepo.findById(folderId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FOLDER_NOT_FOUND));

        String pathWithSelf = folder.getFolderPath() + folder.getFolderName() + "/";
        List<FolderEntity> subFolders = folderRepo.findByFolderPathStartingWith(pathWithSelf);
        folderRepo.deleteAll(subFolders);

        folderRepo.delete(folder);
    }
}
