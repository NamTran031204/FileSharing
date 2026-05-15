package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.commentthread.CommentThreadCreateUpdateDTO;
import org.example.filesharing.entities.dtos.commentthread.CommentThreadFilterDTO;
import org.example.filesharing.entities.models.commentthread.CommentMessage;
import org.example.filesharing.entities.models.CommentThreadEntity;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.enums.ThreadStatus;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.exceptions.specException.FileBusinessException;
import org.example.filesharing.exceptions.specException.UserBusinessException;
import org.example.filesharing.repositories.CommentThreadRepo;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.CommentThreadService;
import org.example.filesharing.services.baseService.BaseAuditService;
import org.example.filesharing.utils.StringUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import static org.example.filesharing.utils.StringUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class CommentThreadServiceImpl extends BaseAuditService<CommentThreadEntity> implements CommentThreadService {

    private final CommentThreadRepo commentThreadRepo;
    private final MongoTemplate mongoTemplate;
    private final AuditService auditService;

    @Override
    @Transactional
    public CommentThreadEntity createNewCommentThread(CommentThreadCreateUpdateDTO dto) {
        validateCreatePayload(dto);

        UserEntity currentUser = auditService.getCurrentUser();
        Instant now = Instant.now();

        // todo: check quyền trước khi comment

        CommentMessage rootComment = normalizeRootCommentForCreate(dto.getRootComment(), currentUser, now);
        List<CommentMessage> replies = normalizeReplies(dto.getReplies(), currentUser, now);
        ThreadStatus status = dto.getStatus() != null ? dto.getStatus() : ThreadStatus.OPEN;

        CommentThreadEntity entity = CommentThreadEntity.builder()
                .assetId(trimToNull(dto.getAssetId()))
                .versionNumber(dto.getVersionNumber())
                .annotations(normalizeStringList(dto.getAnnotations(), false))
                .rootComment(rootComment)
                .replies(replies)
                .replyCount(replies.size())
                .participants(buildParticipants(rootComment, replies))
                .lastActivityAt(calculateLastActivityAt(rootComment, replies, now))
                .status(status)
                .resolvedAt(status == ThreadStatus.RESOLVED ? now : null)
                .resolvedBy(status == ThreadStatus.RESOLVED ? currentUser.getUserId() : null)
                .build();

        buildAudit(entity, true);
        return commentThreadRepo.save(entity);
    }

    @Override
    @Transactional
    public CommentThreadEntity updateCommentThreadDetail(CommentThreadCreateUpdateDTO dto) {
        // todo: check xem user có phải owner của comment không
        validateUpdatePayload(dto);

        String threadId = dto.getThreadId().trim();
        CommentThreadEntity entity = getActiveThreadOrThrow(threadId);

        if (StringUtils.isNotNullOrBlank(dto.getAssetId()) && !dto.getAssetId().trim().equals(entity.getAssetId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "assetId is immutable");
        }

        if (dto.getVersionNumber() != null && !dto.getVersionNumber().equals(entity.getVersionNumber())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "versionId is immutable");
        }

        UserEntity currentUser = auditService.getCurrentUser();
        Instant now = Instant.now();

        if (dto.getAnnotations() != null) {
            entity.setAnnotations(normalizeStringList(dto.getAnnotations(), false));
        }

        if (dto.getRootComment() != null) {
            entity.setRootComment(mergeRootComment(entity.getRootComment(), dto.getRootComment(), currentUser, now));
        }

        if (dto.getReplies() != null) {
            entity.setReplies(normalizeReplies(dto.getReplies(), currentUser, now));
        }

        if (entity.getReplies() == null) {
            entity.setReplies(List.of());
        }
        entity.setReplyCount(entity.getReplies().size());

        if (dto.getStatus() != null) {
            entity.setStatus(dto.getStatus());
            if (dto.getStatus() == ThreadStatus.RESOLVED) {
                entity.setResolvedAt(now);
                entity.setResolvedBy(currentUser.getUserId());
            } else {
                entity.setResolvedAt(null);
                entity.setResolvedBy(null);
            }
        }

        entity.setParticipants(buildParticipants(entity.getRootComment(), entity.getReplies()));
        entity.setLastActivityAt(calculateLastActivityAt(entity.getRootComment(), entity.getReplies(), now));

        buildAudit(entity, false);
        return commentThreadRepo.save(entity);
    }

    @Override
    public PageResult<CommentThreadEntity> getCommentThreadPage(PageRequestDto<CommentThreadFilterDTO> dto) {
        PageRequestDto<CommentThreadFilterDTO> pageRequest = dto != null ? dto : new PageRequestDto<>();
        CommentThreadFilterDTO filter = pageRequest.getFilter();

        Query query = new Query();
        query.addCriteria(Criteria.where("isActive").is(true));

        if (filter != null) {
            if (StringUtils.isNotNullOrBlank(filter.getAssetId())) {
                query.addCriteria(Criteria.where("assetId").is(filter.getAssetId().trim()));
            }

            if (filter.getVersionNumber() != null) {
                query.addCriteria(Criteria.where("versionNumber").is(filter.getVersionNumber()));
            }

            if (StringUtils.isNotNullOrBlank(filter.getAnnotationId())) {
                query.addCriteria(Criteria.where("annotations").in(filter.getAnnotationId().trim()));
            }

            if (StringUtils.isNotNullOrBlank(filter.getParticipant())) {
                query.addCriteria(Criteria.where("participants").in(filter.getParticipant().trim().toLowerCase()));
            }

            if (StringUtils.isNotNullOrBlank(filter.getCreatedBy())) {
                String createdBy = filter.getCreatedBy().trim();
                Criteria rootAuthor = Criteria.where("rootComment.createdBy").is(createdBy);
                Criteria replyAuthor = Criteria.where("replies").elemMatch(Criteria.where("createdBy").is(createdBy));
                query.addCriteria(new Criteria().orOperator(rootAuthor, replyAuthor));
            }

            if (filter.getStatus() != null) {
                query.addCriteria(Criteria.where("status").is(filter.getStatus()));
            }

            if (filter.getFromLastActivityAt() != null || filter.getToLastActivityAt() != null) {
                Criteria lastActivityCriteria = Criteria.where("lastActivityAt");
                if (filter.getFromLastActivityAt() != null && filter.getToLastActivityAt() != null) {
                    query.addCriteria(lastActivityCriteria.gte(filter.getFromLastActivityAt()).lte(filter.getToLastActivityAt()));
                } else if (filter.getFromLastActivityAt() != null) {
                    query.addCriteria(lastActivityCriteria.gte(filter.getFromLastActivityAt()));
                } else {
                    query.addCriteria(lastActivityCriteria.lte(filter.getToLastActivityAt()));
                }
            }

            if (StringUtils.isNotNullOrBlank(filter.getKeyword())) {
                String escapedKeyword = Pattern.quote(filter.getKeyword().trim());
                Criteria rootContent = Criteria.where("rootComment.content").regex(escapedKeyword, "i");
                Criteria replyContent = Criteria.where("replies")
                        .elemMatch(Criteria.where("content").regex(escapedKeyword, "i"));
                query.addCriteria(new Criteria().orOperator(rootContent, replyContent));
            }
        }

        long totalCount = mongoTemplate.count(query, CommentThreadEntity.class);

        int maxResultCount = pageRequest.getMaxResultCount() == null || pageRequest.getMaxResultCount() <= 0
                ? 10
                : pageRequest.getMaxResultCount();
        int skipCount = pageRequest.getSkipCount() == null || pageRequest.getSkipCount() < 0
                ? 0
                : pageRequest.getSkipCount();
        int pageIndex = skipCount / maxResultCount;

        Sort sort = parseSortFromRequest(pageRequest.getSorting());
        query.with(PageRequest.of(pageIndex, maxResultCount, sort));

        List<CommentThreadEntity> data = mongoTemplate.find(query, CommentThreadEntity.class);

        return PageResult.<CommentThreadEntity>builder()
                .totalCount(totalCount)
                .data(data)
                .build();
    }

    @Override
    public CommentThreadEntity getCommentThreadById(String threadId) {
        if (StringUtils.isNullOrBlank(threadId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "threadId is required");
        }

        return getActiveThreadOrThrow(threadId.trim());
    }

    @Override
    @Transactional
    public String deleteCommentThread(String threadId) {
        // todo: check comment owner or admin
        if (StringUtils.isNullOrBlank(threadId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "threadId is required");
        }

        CommentThreadEntity entity = getActiveThreadOrThrow(threadId.trim());
        entity.setIsActive(false);
        entity.setLastActivityAt(Instant.now());
        commentThreadRepo.save(entity);

        return "Comment thread deleted successfully";
    }

    private void validateCreatePayload(CommentThreadCreateUpdateDTO dto) {
        if (dto == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }

        if (StringUtils.isNullOrBlank(dto.getAssetId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "assetId is required");
        }

        if (dto.getVersionNumber() == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "version is required");
        }

        if (dto.getRootComment() == null || StringUtils.isNullOrBlank(dto.getRootComment().getContent())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "rootComment.content is required");
        }
    }

    private void validateUpdatePayload(CommentThreadCreateUpdateDTO dto) {
        if (dto == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }

        if (StringUtils.isNullOrBlank(dto.getThreadId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "threadId is required");
        }
    }

    private CommentThreadEntity getActiveThreadOrThrow(String threadId) {
        return commentThreadRepo.findByThreadIdAndIsActiveTrue(threadId)
                .orElseThrow(() -> new FileBusinessException(
                        ErrorCode.FILE_NOT_FOUND,
                        "Cannot find active comment thread with id: " + threadId
                ));
    }

    private CommentMessage normalizeRootCommentForCreate(CommentMessage input, UserEntity currentUser, Instant now) {
        String normalizedContent = trimToNull(input.getContent());
        if (StringUtils.isNullOrBlank(normalizedContent)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "rootComment.content is required");
        }

        return CommentMessage.builder()
                .commentId(StringUtils.isNotNullOrBlank(input.getCommentId())
                        ? input.getCommentId().trim()
                        : UUID.randomUUID().toString())
                .replyToComment(null)
                .content(normalizedContent)
                .mentions(normalizeStringList(input.getMentions(), true))
                .attachments(input.getAttachments())
                .createdBy(currentUser.getUserId())
                .createdByEmail(normalizeEmail(currentUser.getEmail()))
                .createdByName(trimToNull(currentUser.getPublicUserName()))
                .createdAt(input.getCreatedAt() != null ? input.getCreatedAt() : now)
                .editedAt(input.getEditedAt())
                .build();
    }

    private CommentMessage mergeRootComment(
            CommentMessage currentRoot,
            CommentMessage incomingRoot,
            UserEntity currentUser,
            Instant now
    ) {
        if (currentRoot == null) {
            return normalizeRootCommentForCreate(incomingRoot, currentUser, now);
        }

        boolean edited = false;
        String content = currentRoot.getContent();
        if (incomingRoot.getContent() != null) {
            String normalizedContent = trimToNull(incomingRoot.getContent());
            if (StringUtils.isNullOrBlank(normalizedContent)) {
                throw new UserBusinessException(ErrorCode.BAD_REQUEST, "rootComment.content cannot be blank");
            }
            content = normalizedContent;
            edited = true;
        }

        List<String> mentions = currentRoot.getMentions();
        if (incomingRoot.getMentions() != null) {
            mentions = normalizeStringList(incomingRoot.getMentions(), true);
            edited = true;
        }

        return CommentMessage.builder()
                .commentId(currentRoot.getCommentId())
                .replyToComment(currentRoot.getReplyToComment())
                .content(content)
                .mentions(mentions)
                .attachments(incomingRoot.getAttachments() != null
                        ? incomingRoot.getAttachments()
                        : currentRoot.getAttachments())
                .createdBy(currentRoot.getCreatedBy())
                .createdByEmail(currentRoot.getCreatedByEmail())
                .createdByName(currentRoot.getCreatedByName())
                .createdAt(currentRoot.getCreatedAt())
                .editedAt(edited ? now : currentRoot.getEditedAt())
                .build();
    }

    private List<CommentMessage> normalizeReplies(List<CommentMessage> replies, UserEntity currentUser, Instant now) {
        if (replies == null) {
            return List.of();
        }

        List<CommentMessage> normalizedReplies = new ArrayList<>();
        for (CommentMessage reply : replies) {
            if (reply == null) {
                continue;
            }

            String content = trimToNull(reply.getContent());
            if (StringUtils.isNullOrBlank(content)) {
                continue;
            }

            normalizedReplies.add(CommentMessage.builder()
                    .commentId(StringUtils.isNotNullOrBlank(reply.getCommentId())
                            ? reply.getCommentId().trim()
                            : UUID.randomUUID().toString())
                    .replyToComment(trimToNull(reply.getReplyToComment()))
                    .content(content)
                    .mentions(normalizeStringList(reply.getMentions(), true))
                    .attachments(reply.getAttachments())
                    .createdBy(StringUtils.isNotNullOrBlank(reply.getCreatedBy())
                            ? reply.getCreatedBy().trim()
                            : currentUser.getUserId())
                    .createdByEmail(StringUtils.isNotNullOrBlank(reply.getCreatedByEmail())
                            ? normalizeEmail(reply.getCreatedByEmail())
                            : normalizeEmail(currentUser.getEmail()))
                    .createdByName(StringUtils.isNotNullOrBlank(reply.getCreatedByName())
                            ? reply.getCreatedByName().trim()
                            : trimToNull(currentUser.getPublicUserName()))
                    .createdAt(reply.getCreatedAt() != null ? reply.getCreatedAt() : now)
                    .editedAt(reply.getEditedAt())
                    .build());
        }

        return normalizedReplies;
    }

    private List<String> buildParticipants(CommentMessage rootComment, List<CommentMessage> replies) {
        Set<String> participants = new LinkedHashSet<>();
        collectParticipantsFromComment(rootComment, participants);

        if (replies != null) {
            for (CommentMessage reply : replies) {
                collectParticipantsFromComment(reply, participants);
            }
        }

        return new ArrayList<>(participants);
    }

    private void collectParticipantsFromComment(CommentMessage comment, Set<String> participants) {
        if (comment == null) {
            return;
        }

        String createdByEmail = normalizeEmail(comment.getCreatedByEmail());
        if (createdByEmail != null) {
            participants.add(createdByEmail);
        }

        if (comment.getMentions() != null) {
            for (String mention : comment.getMentions()) {
                String normalizedMention = normalizeEmail(mention);
                if (normalizedMention != null) {
                    participants.add(normalizedMention);
                }
            }
        }
    }

    private Instant calculateLastActivityAt(CommentMessage rootComment, List<CommentMessage> replies, Instant fallback) {
        Instant latest = fallback;

        latest = maxInstant(latest, getCommentLatestTimestamp(rootComment));
        if (replies != null) {
            for (CommentMessage reply : replies) {
                latest = maxInstant(latest, getCommentLatestTimestamp(reply));
            }
        }

        return latest;
    }

    private Instant getCommentLatestTimestamp(CommentMessage comment) {
        if (comment == null) {
            return null;
        }

        Instant createdAt = comment.getCreatedAt();
        Instant editedAt = comment.getEditedAt();

        if (createdAt == null) {
            return editedAt;
        }
        if (editedAt == null) {
            return createdAt;
        }

        return editedAt.isAfter(createdAt) ? editedAt : createdAt;
    }

    private Instant maxInstant(Instant first, Instant second) {
        if (first == null) {
            return second;
        }
        if (second == null) {
            return first;
        }
        return second.isAfter(first) ? second : first;
    }

    private List<String> normalizeStringList(List<String> values, boolean lowerCase) {
        if (values == null) {
            return List.of();
        }

        List<String> normalized = new ArrayList<>();
        for (String value : values) {
            String sanitized = trimToNull(value);
            if (sanitized == null) {
                continue;
            }

            if (lowerCase) {
                sanitized = sanitized.toLowerCase();
            }

            if (!normalized.contains(sanitized)) {
                normalized.add(sanitized);
            }
        }
        return normalized;
    }

    private Sort parseSortFromRequest(String sorting) {
        if (sorting == null || sorting.isBlank()) {
            return Sort.unsorted();
        }

        String[] parts = sorting.split(",", 2);
        if (parts.length < 2) {
            return Sort.unsorted();
        }

        String directionRaw = parts[0].trim();
        String field = parts[1].trim();
        if (field.isEmpty()) {
            return Sort.unsorted();
        }

        Sort.Direction direction = "DESC".equalsIgnoreCase(directionRaw)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        return Sort.by(direction, field);
    }

    private String normalizeEmail(String email) {
        String normalized = trimToNull(email);
        return normalized == null ? null : normalized.toLowerCase();
    }
}
