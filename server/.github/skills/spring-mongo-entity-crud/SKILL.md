---
name: spring-mongo-entity-crud
description: Implement full CRUD for a MongoDB entity in this FileSharing backend style (Spring Boot 3, Java 21). Use this skill whenever the user asks to add a new entity API/service/repository/DTO stack, asks for "lam CRUD cho entity", asks to follow ProjectController pattern, or mentions PageRequestDto paging, sorting parsing, isActive filtering, and soft delete.
---

# Spring Mongo Entity CRUD

## Why this skill exists
Use this skill to generate a consistent CRUD flow for one entity by following the same architecture used by Project APIs in this repository. The goal is to produce code that fits existing conventions and avoids regressions around paging, sorting, and soft-delete behavior.

## Read these references first
Before generating code, read these files to align with repository conventions:

1. filesharing-filehandler/src/main/java/org/example/filesharing/controllers/ProjectController.java
2. filesharing-filehandler/src/main/java/org/example/filesharing/entities/models/core/ProjectEntity.java
3. filesharing-filehandler/src/main/java/org/example/filesharing/services/ProjectService.java
4. filesharing-filehandler/src/main/java/org/example/filesharing/services/impl/ProjectServiceImpl.java
5. filesharing-filehandler/src/main/java/org/example/filesharing/repositories/ProjectRepo.java
6. filesharing-filehandler/src/main/java/org/example/filesharing/entities/PageRequestDto.java

## Non-negotiable constraints

1. Keep implementation compatible with Spring Boot 3, Java 21, and MongoDB.
2. Infer DTO fields from the target entity attributes (do not blindly copy all fields).
3. Put all new DTOs under:
   filesharing-filehandler/src/main/java/org/example/filesharing/entities/dtos/<entity-package>/
   where <entity-package> is the lowercase entity name without the Entity suffix.
4. Use one shared input DTO for create and update.
5. Return entity directly for create, update, get-by-id, and get-page payload items.
6. For get-page input, use PageRequestDto<FilterDTO>.
7. Parse sorting from PageRequestDto.sorting where common format is:
   ASC, <field-name>
   or
   DESC, <field-name>
8. All read APIs must only return active data (isActive = true).
9. Delete must be soft delete only: update isActive = false. Never physically delete from MongoDB.

## Target output structure
When implementing CRUD for entity <EntityName>Entity, generate/update these artifacts:

1. Controller:
   filesharing-filehandler/src/main/java/org/example/filesharing/controllers/<EntityName>Controller.java
2. Service interface:
   filesharing-filehandler/src/main/java/org/example/filesharing/services/<EntityName>Service.java
3. Service implementation:
   filesharing-filehandler/src/main/java/org/example/filesharing/services/impl/<EntityName>ServiceImpl.java
4. Repository:
   filesharing-filehandler/src/main/java/org/example/filesharing/repositories/<EntityName>Repo.java
5. DTO package:
   filesharing-filehandler/src/main/java/org/example/filesharing/entities/dtos/<entity-package>/
6. Entity model if missing:
   filesharing-filehandler/src/main/java/org/example/filesharing/entities/models/core/<EntityName>Entity.java

## DTO generation rules
Given entity fields, classify fields into groups before creating DTOs.

1. Identity and audit fields: id, createdAt, updatedAt, createdBy, updatedBy, trashedAt.
   - Do not require these from clients.
2. System state fields: isActive, status, ownerId, ownerEmail.
   - Populate in service logic, not from public create input unless explicitly needed.
3. Business fields: all domain attributes required to create/update business data.
   - Put these in the shared create/update DTO.

Create at minimum:

1. <EntityName>CreateUpdateDTO
   - Shared input for create and update.
   - Include entity id field as optional; required when update.
2. <EntityName>FilterDTO
   - Fields useful for querying in get-page.
   - Include only relevant filter fields (keyword, status, date range, owner, etc.).

## API contract template
Mirror ProjectController naming style unless user asks otherwise.

1. POST /create-new
   - Input: <EntityName>CreateUpdateDTO
   - Output: CommonResponse<<EntityName>Entity>
2. POST /update-detail
   - Input: <EntityName>CreateUpdateDTO
   - Output: CommonResponse<<EntityName>Entity>
3. POST /get-page
   - Input: PageRequestDto<<EntityName>FilterDTO>
   - Output: CommonResponse<PageResult<<EntityName>Entity>>
4. GET /get-by-id/{entityId}
   - Output: CommonResponse<<EntityName>Entity>
5. POST /delete/{entityId}
   - Output: CommonResponse<String> (or entity if user asks)

## Service behavior rules

### Create
1. Validate required business fields.
2. Normalize string fields (trim, convert empty to null where appropriate).
3. Set default values for system fields (including isActive = true).
4. Save and return entity.

### Update
1. Require id in shared DTO.
2. Load entity by id; if not found, throw business exception.
3. Update only provided fields.
4. Never allow update of immutable/system-managed fields unless explicitly requested.
5. Save and return entity.

### Get by id
1. Require non-blank id.
2. Fetch entity.
3. Return only when isActive = true.
4. If not active or not found, return not-found style exception.

### Get page
1. Accept PageRequestDto<FilterDTO>.
2. Build Mongo Query with filter criteria.
3. Always add Criteria.where("isActive").is(true).
4. Parse sorting from dto.sorting in the format ASC|DESC, fieldName.
5. Apply paging and sorting, return PageResult.

### Delete (soft)
1. Load entity by id.
2. Set isActive = false.
3. Optionally set status/trashedAt when the entity supports trash semantics.
4. Save entity.
5. Never call deleteById or remove.

## Sorting parser guidance
The repository has an existing PageRequestDto parser, but this skill expects explicit handling for input patterns like "DESC, createdAt". Implement a local parser in service when needed.

Example parser:

```java
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
```

When applying paging:

```java
int maxResultCount = dto.getMaxResultCount() == null || dto.getMaxResultCount() <= 0 ? 10 : dto.getMaxResultCount();
int skipCount = dto.getSkipCount() == null || dto.getSkipCount() < 0 ? 0 : dto.getSkipCount();
int pageIndex = skipCount / maxResultCount;
Sort sort = parseSortFromRequest(dto.getSorting());
query.with(PageRequest.of(pageIndex, maxResultCount, sort));
```

## Repository guidance
Use repository methods that support active-state checks where appropriate, for example:

1. Optional<<EntityName>Entity> findByIdAndIsActiveTrue(String id)
2. boolean existsBy<UniqueField>AndIsActiveTrue(...)

If not using repository-derived query methods, enforce isActive = true in MongoTemplate Query.

## Definition of done
Before finishing, verify all items:

1. DTO package exists under entities/dtos/<entity-package>.
2. Create and update share one DTO input type.
3. get-page input is PageRequestDto<FilterDTO>.
4. Sorting string ASC|DESC, fieldName is parsed correctly.
5. All read APIs enforce isActive = true.
6. Delete is soft delete (isActive=false) and does not remove data.
7. Response wrappers and naming match existing controller style.
8. Build passes for filesharing-filehandler module.

## Suggested verification
Run compile after code generation:

```bash
mvn -pl filesharing-filehandler -DskipTests compile
```

Then test sample requests for:

1. create-new
2. update-detail
3. get-page with sorting = DESC, createdAt
4. get-by-id after soft delete (should not return active result)
5. delete endpoint should preserve document but set isActive=false

## Response format when using this skill
When presenting results, include:

1. Summary of generated files.
2. Key design choices for DTO fields inferred from entity.
3. How sorting parse was implemented.
4. How isActive read filter and soft delete were enforced.
5. Any assumptions requiring user confirmation.
