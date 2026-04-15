# Bao cao huong dan implement policy isActive = true cho MongoDB Repository

## 1. Muc tieu
- Moi query read phai mac dinh co dieu kien isActive = true.
- Giam rui ro bo sot dieu kien khi them query moi.
- Van cho phep luong dac biet (admin, trash, audit) khi can doc inactive.

## 2. Pham vi ap dung trong codebase hien tai
- Module: filesharing-filehandler
- Cac entity dang co field isActive ro rang: ProjectEntity, MetadataEntity.
- UserEntity hien tai dung field enabled, khong co field isActive.

Luu y:
- Khong ep co hoc cho entity khong co field isActive.
- Nen chuan hoa naming: uu tien Boolean isActive tren cac collection can soft-delete/TTL.

## 3. Cach 2: Dung @Query de gan isActive = true tren tung method

### 3.1 Khi nao dung
- Query co logic ro rang, khong qua dong.
- Team muon de doc, de review ngay tren repository method.

### 3.2 Cac buoc implement
1. Tim cac method read trong repository cua entity co isActive.
2. Them method moi voi ten active ro nghia va gan @Query co isActive = true.
3. Refactor service dang goi method cu sang method active.
4. Viet test xac nhan du lieu inactive khong duoc tra ve.

### 3.3 Vi du cho ProjectRepo
```java
package org.example.filesharing.repositories;

import org.example.filesharing.entities.models.core.ProjectEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectRepo extends MongoRepository<ProjectEntity, String> {

    @Query("{ '_id': ?0, 'isActive': true }")
    Optional<ProjectEntity> findActiveById(String projectId);

    @Query("{ 'projectCode': ?0, 'isActive': true }")
    Optional<ProjectEntity> findActiveByProjectCode(String projectCode);

    @Query(value = "{ 'isActive': true }")
    Page<ProjectEntity> findAllActive(Pageable pageable);

    @Query(value = "{ 'isActive': true, '$or': [ " +
            "{ 'projectName': { '$regex': ?0, '$options': 'i' } }, " +
            "{ 'projectCode': { '$regex': ?0, '$options': 'i' } } " +
            "] }")
    Page<ProjectEntity> searchActiveByNameOrCode(String keyword, Pageable pageable);
}
```

### 3.4 Uu/nhuoc diem
- Uu diem:
  - De ap dung nhanh.
  - De review theo tung method.
- Nhuoc diem:
  - Van la thu cong, de bo sot neu tao method moi ma quen them isActive.

## 4. Cach 3: Tao Base Repository de chuan hoa "active methods"

### 4.1 Muc tieu
- Tao 1 interface chung cho cac repository cua entity co isActive.
- Ep cac team member uu tien dung method active thay vi method goc.

### 4.2 Cac buoc implement
1. Tao base interface danh cho entity co isActive.
2. Cac repository nhu ProjectRepo, MetadataRepo se extends base interface nay.
3. Team convention: service chi goi method active.
4. Optional: danh dau method read goc la deprecated trong coding guideline noi bo.

### 4.3 Vi du interface base
```java
package org.example.filesharing.repositories.base;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.repository.NoRepositoryBean;

import java.io.Serializable;
import java.util.Optional;

@NoRepositoryBean
public interface ActiveOnlyMongoRepository<T, ID extends Serializable>
        extends MongoRepository<T, ID> {

    @Query("{ '_id': ?0, 'isActive': true }")
    Optional<T> findActiveById(ID id);

    @Query("{ 'isActive': true }")
    Page<T> findAllActive(Pageable pageable);
}
```

### 4.4 Vi du su dung
```java
package org.example.filesharing.repositories;

import org.example.filesharing.entities.models.core.MetadataEntity;
import org.example.filesharing.repositories.base.ActiveOnlyMongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MetadataRepo extends ActiveOnlyMongoRepository<MetadataEntity, String> {

    @org.springframework.data.mongodb.repository.Query(
            "{ 'objectName': ?0, 'uploadId': ?1, 'isActive': true }")
    Optional<MetadataEntity> findActiveByObjectNameAndUploadId(String objectName, String uploadId);
}
```

### 4.5 Uu/nhuoc diem
- Uu diem:
  - Chuan hoa API, giam duplicate.
  - Nhin method name la biet policy.
- Nhuoc diem:
  - Method goc tu MongoRepository van ton tai, nen chua chan 100% viec goi nham.
  - Can them team rule/code review.

## 5. Cach 4: Custom Repository + MongoTemplate (khuyen nghi cho query dong)

### 5.1 Khi nao dung
- Query dong theo filter phuc tap (keyword, date range, status, owner, sort, paging).
- Can 1 cho trung tam de attach policy isActive = true.

### 5.2 Cac buoc implement
1. Tao custom repository interface cho use case query dong.
2. Tao class Impl dung MongoTemplate.
3. Viet ham ensureActive(query) de tu dong them Criteria.where("isActive").is(true).
4. Neu query da co isActive (vi du man hinh trash), cho phep override co kiem soat.
5. Gan custom interface vao repository chinh.

### 5.3 Vi du
```java
package org.example.filesharing.repositories.custom;

import org.example.filesharing.entities.models.core.ProjectEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProjectRepoCustom {
    Page<ProjectEntity> searchActive(String keyword, Boolean statusFilter, Pageable pageable);
}
```

```java
package org.example.filesharing.repositories.custom.impl;

import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.example.filesharing.entities.models.core.ProjectEntity;
import org.example.filesharing.repositories.custom.ProjectRepoCustom;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class ProjectRepoCustomImpl implements ProjectRepoCustom {

    private final MongoTemplate mongoTemplate;

    @Override
    public Page<ProjectEntity> searchActive(String keyword, Boolean statusFilter, Pageable pageable) {
        Query query = new Query();

        if (keyword != null && !keyword.isBlank()) {
            query.addCriteria(new Criteria().orOperator(
                    Criteria.where("projectName").regex(keyword, "i"),
                    Criteria.where("projectCode").regex(keyword, "i")
            ));
        }

        if (statusFilter != null) {
            query.addCriteria(Criteria.where("status").is(statusFilter));
        }

        ensureActive(query);

        long total = mongoTemplate.count(query, ProjectEntity.class);
        query.with(pageable);
        List<ProjectEntity> data = mongoTemplate.find(query, ProjectEntity.class);

        return new PageImpl<>(data, pageable, total);
    }

    private void ensureActive(Query query) {
        Document root = query.getQueryObject();
        if (!root.containsKey("isActive")) {
            query.addCriteria(Criteria.where("isActive").is(true));
        }
    }
}
```

```java
package org.example.filesharing.repositories;

import org.example.filesharing.entities.models.core.ProjectEntity;
import org.example.filesharing.repositories.custom.ProjectRepoCustom;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRepo extends MongoRepository<ProjectEntity, String>, ProjectRepoCustom {
}
```

### 5.4 Uu/nhuoc diem
- Uu diem:
  - Policy tap trung, phu hop query dong phuc tap.
  - Giam manh duplicated Criteria trong service.
- Nhuoc diem:
  - Nhieu code hon cach 2.
  - Can to chuc package ro rang (custom, impl, shared query utils).

## 6. De xuat rollout cho du an hien tai
1. Ngan han:
   - Ap dung cach 2 cho cac query read co san o ProjectRepo, MetadataRepo.
2. Trung han:
   - Tach cac query dong trong service dang dung MongoTemplate sang custom repository theo cach 4.
3. Song song:
   - Them base repository cach 3 cho cac entity co isActive de chuan hoa API active.

## 7. Checklist test sau khi implement
- Unit test:
  - Query active khong tra ve document isActive = false.
  - Query active van tra ve dung document isActive = true.
- Integration test voi MongoDB:
  - Seed ca active/inactive, verify ket qua paging va count.
- Regression test:
  - Cac use case trash/admin duoc phep xem inactive phai hoat dong dung nhu expected.

## 8. Ket luan
- Cach 2: nhanh nhat, de lam ngay.
- Cach 3: chuan hoa interface, giam bo sot qua convention.
- Cach 4: manh nhat cho query dong va policy tap trung.

Khuyen nghi cho module filesharing-filehandler:
- Dung ket hop 2 + 4 la thuc dung nhat.
- Bo sung 3 de standard hoa cho cac repository moi.
