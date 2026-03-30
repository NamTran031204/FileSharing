# MONGO COMMAND

<!-- TOC -->
* [MONGO COMMAND](#mongo-command)
    * [I. CRUD Cơ bản (Create, Read, Update, Delete)](#i-crud-cơ-bản-create-read-update-delete)
    * [II. Phân trang & Sắp xếp (Pagination & Sorting)](#ii-phân-trang--sắp-xếp-pagination--sorting)
    * [III. Truy vấn Nâng cao & Kiểu dữ liệu đặc biệt](#iii-truy-vấn-nâng-cao--kiểu-dữ-liệu-đặc-biệt)
    * [IV. Pagination + Filter (Phân trang kết hợp nhiều điều kiện lọc)](#iv-pagination--filter-phân-trang-kết-hợp-nhiều-điều-kiện-lọc)
    * [V. Projection (Chỉ lấy một số trường cần thiết)](#v-projection-chỉ-lấy-một-số-trường-cần-thiết)
    * [VI. Aggregation: Lookup (Join Collection)](#vi-aggregation-lookup-join-collection)
    * [VII. Aggregation: Group By (Thống kê)](#vii-aggregation-group-by-thống-kê)
    * [Tóm tắt nhanh cú pháp](#tóm-tắt-nhanh-cú-pháp)
<!-- TOC -->

Quy ước:

* **Repo**: `UserRepository` extends `MongoRepository<UserEntity, String>`
* **Template**: `MongoTemplate`
* **Shell**: Gõ trực tiếp vào terminal hoặc tab Query của Mongo Compass.

-----

### I. CRUD Cơ bản (Create, Read, Update, Delete)

**1. Tạo mới (Create)**

* **Repo**: `userRepository.save(userEntity)` hoặc `userRepository.insert(userEntity)`
* **Template**: `mongoTemplate.save(userEntity)`
* **Shell**:
  ```javascript
  db.user.insertOne({
      "email": "test@gmail.com",
      "userName": "Nam Nguyen",
      "roles": ["ROLE_USER"],
      "enabled": true,
      "createdAt": ISODate("2025-10-27T10:00:00Z")
  })
  ```

**2. Lấy chi tiết theo ID (Read Detail)**

* **Repo**: `userRepository.findById("653fb...")`
* **Template**: `mongoTemplate.findById("653fb...", UserEntity.class)`
* **Shell**:
  ```javascript
  db.user.findOne({ "_id": ObjectId("653fb...") })
  ```

**3. Tìm theo Email chính xác (Read by Field)**

* **Repo**: `userRepository.findByEmail("test@gmail.com")`
* **Template**:
  ```java
  Query query = new Query(Criteria.where("email").is("test@gmail.com"));
  mongoTemplate.findOne(query, UserEntity.class);
  ```
* **Shell**:
  ```javascript
  db.user.find({ "email": "test@gmail.com" })
  ```

**4. Cập nhật một trường (Partial Update - ví dụ đổi userName)**

* **Repo**: (Không hỗ trợ update từng trường tốt, phải load lên -\> sửa -\> save lại).
* **Template**:
  ```java
  Query query = new Query(Criteria.where("id").is("653fb..."));
  Update update = new Update().set("userName", "New Name").set("updatedAt", Instant.now());
  mongoTemplate.updateFirst(query, update, UserEntity.class);
  ```
* **Shell**:
  ```javascript
  db.user.updateOne(
      { "_id": ObjectId("653fb...") },
      { $set: { "userName": "New Name", "updatedAt": ISODate(...) } }
  )
  ```

**5. Xóa (Delete)**

* **Repo**: `userRepository.deleteById("653fb...")`
* **Template**:
  ```java
  Query query = new Query(Criteria.where("id").is("653fb..."));
  mongoTemplate.remove(query, UserEntity.class);
  ```
* **Shell**:
  ```javascript
  db.user.deleteOne({ "_id": ObjectId("653fb...") })
  ```

-----

### II. Phân trang & Sắp xếp (Pagination & Sorting)

Giả sử: Lấy trang 2 (page index = 1), mỗi trang 10 phần tử, sắp xếp ngày tạo mới nhất.

* **Repo**:
  ```java
  Pageable pageable = PageRequest.of(1, 10, Sort.by("createdAt").descending());
  Page<UserEntity> page = userRepository.findAll(pageable);
  ```
* **Template**:
  ```java
  Query query = new Query();
  query.with(PageRequest.of(1, 10, Sort.by(Sort.Direction.DESC, "createdAt")));
  List<UserEntity> list = mongoTemplate.find(query, UserEntity.class);
  // Lưu ý: Template không trả về Page object tự động, phải query count riêng để tính total.
  long total = mongoTemplate.count(query.skip(-1).limit(-1), UserEntity.class);
  ```
* **Shell**:
  ```javascript
  // skip = (page - 1) * size = (2 - 1) * 10 = 10
  db.user.find().sort({ "createdAt": -1 }).skip(10).limit(10)
  ```

-----

### III. Truy vấn Nâng cao & Kiểu dữ liệu đặc biệt

**1. Truy vấn Enum trong List (Role)**
*Yêu cầu: Tìm user có quyền `ROLE_ADMIN`.*
(Trong MongoDB, List Enum lưu dưới dạng mảng String `["ROLE_USER", "ROLE_ADMIN"]`).

* **Repo**: `userRepository.findByRolesContaining(UserRole.ROLE_ADMIN)`
* **Template**:
  ```java
  Query query = new Query(Criteria.where("roles").is("ROLE_ADMIN"));
  ```
* **Shell**: (Mongo tự hiểu tìm phần tử trong mảng)
  ```javascript
  db.user.find({ "roles": "ROLE_ADMIN" })
  ```

**2. Truy vấn Object lồng nhau (Nested Object - AuthProvider)**
*Yêu cầu: Tìm user đã liên kết tài khoản `GOOGLE`.*
(Cấu trúc: `providers` là List, bên trong có field `provider`,).

* **Repo**: `userRepository.findByProvidersProvider(AuthProvider.GOOGLE)`
* **Template**:
  ```java
  // Dùng dấu chấm để truy cập thuộc tính con
  Query query = new Query(Criteria.where("providers.provider").is("GOOGLE"));
  ```
* **Shell**:
  ```javascript
  db.user.find({ "providers.provider": "GOOGLE" })
  ```

**3. Truy vấn Map (Metadata)**
*Yêu cầu: Tìm user có metadata chứa key `locale` giá trị `vi-VN`.*
(Cấu trúc: `private Map<String, Object> metadata`).

* **Repo**: (Khó đặt tên hàm, nên dùng `@Query`)
  `@Query("{ 'metadata.locale': ?0 }")`
* **Template**:
  ```java
  Query query = new Query(Criteria.where("metadata.locale").is("vi-VN"));
  ```
* **Shell**:
  ```javascript
  db.user.find({ "metadata.locale": "vi-VN" })
  ```

**4. Kiểm tra Key tồn tại trong Map**
*Yêu cầu: Tìm user có chứa thông tin `avatar` trong metadata (bất kể giá trị là gì).*

* **Template**:
  ```java
  Query query = new Query(Criteria.where("metadata.avatar").exists(true));
  ```
* **Shell**:
  ```javascript
  db.user.find({ "metadata.avatar": { $exists: true } })
  ```

**5. Truy vấn khoảng thời gian (Date Range)**
*Yêu cầu: Tìm user đăng ký trong tháng 10/2025.*

* **Repo**: `userRepository.findByCreatedAtBetween(Instant start, Instant end)`
* **Template**:
  ```java
  Query query = new Query(Criteria.where("createdAt").gte(start).lte(end));
  ```
* **Shell**:
  ```javascript
  db.user.find({
      "createdAt": {
          $gte: ISODate("2025-10-01T00:00:00Z"),
          $lte: ISODate("2025-10-31T23:59:59Z")
      }
  })
  ```

**6. Tìm kiếm gần đúng (Like / Regex)**
*Yêu cầu: Tìm user có `userName` chứa chữ "Nam" (không phân biệt hoa thường).*

* **Repo**: `userRepository.findByUserNameContainingIgnoreCase("Nam")`
* **Template**:
  ```java
  Query query = new Query(Criteria.where("userName").regex("Nam", "i"));
  ```
* **Shell**:
  ```javascript
  db.user.find({ "userName": /Nam/i })
  ```
-----

### IV. Pagination + Filter (Phân trang kết hợp nhiều điều kiện lọc)

**Bài toán:** Tìm các user có `userName` chứa chữ "Nguyen" (không phân biệt hoa thường) **VÀ** có quyền `ROLE_USER`, lấy trang thứ 1 (index 0), size 10, sắp xếp theo `email` tăng dần.

* **Repo (Cách 1 - Query Method):**

  ```java
  // Spring Data tự động ghép query
  Page<UserEntity> findByUserNameContainingIgnoreCaseAndRolesContaining(
      String userName, 
      UserRole role, 
      Pageable pageable
  );
  // Sử dụng: find...("Nguyen", UserRole.ROLE_USER, PageRequest.of(0, 10, Sort.by("email")));
  ```

* **Template (Cách 2 - Dynamic Query - Khuyên dùng cho filter phức tạp):**

  ```java
  Query query = new Query();

  // 1. Thêm điều kiện lọc
  query.addCriteria(Criteria.where("userName").regex("Nguyen", "i"));
  query.addCriteria(Criteria.where("roles").is(UserRole.ROLE_USER));

  // 2. Cấu hình phân trang
  Pageable pageable = PageRequest.of(0, 10, Sort.by("email").ascending());
  query.with(pageable);

  // 3. Thực thi
  List<UserEntity> users = mongoTemplate.find(query, UserEntity.class);
  long total = mongoTemplate.count(query.skip(-1).limit(-1), UserEntity.class); // Đếm lại tổng
  Page<UserEntity> page = new PageImpl<>(users, pageable, total);
  ```

* **Shell (Mongo Terminal):**

  ```javascript
  db.user.find({
      "userName": /Nguyen/i,
      "roles": "ROLE_USER"
  })
  .sort({ "email": 1 }) // 1 là tăng dần, -1 là giảm dần
  .skip(0)              // (pageNumber) * pageSize = 0 * 10
  .limit(10)
  ```

-----

### V. Projection (Chỉ lấy một số trường cần thiết)

**Bài toán:** API danh sách Dropdown chỉ cần `id`, `userName` và `email`. Không muốn load trường `metadata` (nặng) và `password` (bảo mật).

* **Repo (Cách 1 - @Query fields):**

  ```java
  // value = query điều kiện (rỗng là lấy hết), fields = 1 là lấy, 0 là bỏ
  @Query(value = "{}", fields = "{ 'userName' : 1, 'email' : 1 }")
  List<UserEntity> findAllNameAndEmail();

  // Hoặc trả về Interface Projection (DTO)
  interface UserSummary {
      String getUserName();
      String getEmail();
  }
  List<UserSummary> findByEnabledTrue();
  ```

* **Template (Cách 2):**

  ```java
  Query query = new Query();
  // Bật các field muốn lấy
  query.fields().include("userName").include("email");
  // query.fields().exclude("password"); // Hoặc loại bỏ field không muốn

  List<UserEntity> result = mongoTemplate.find(query, UserEntity.class);
  // Lưu ý: Các field không được include sẽ null
  ```

* **Shell (Mongo Terminal):**

  ```javascript
  // Tham số thứ 2 là projection: 1 (show), 0 (hide)
  // _id mặc định luôn hiện, muốn tắt phải set _id: 0
  db.user.find({}, { "userName": 1, "email": 1 }) 
  ```

-----

### VI. Aggregation: Lookup (Join Collection)

*Lưu ý: MongoDB là NoSQL, việc Join (Lookup) thường làm giảm hiệu năng. Tuy nhiên trong các trường hợp reporting, nó rất cần thiết.*

**Bài toán:** Giả sử bạn có collection `audit_log` (lưu lịch sử user làm gì), trường `audit_log.userId` liên kết với `user.id`. Bạn muốn lấy User kèm theo danh sách Log của họ.

* **Template (Dùng Aggregation Framework):**

  ```java
  // 1. Định nghĩa Lookup (Join)
  LookupOperation lookup = LookupOperation.newLookup()
          .from("audit_log")       // Tên bảng (collection) con
          .localField("_id")       // Khoá chính bảng User (String)
          .foreignField("userId")  // Khoá ngoại bảng Log
          .as("logs");             // Tên field mới chứa danh sách log
          
  // 2. Có thể thêm Match (Filter)
  MatchOperation match = Aggregation.match(Criteria.where("email").is("test@gmail.com"));

  // 3. Thực thi Pipeline
  Aggregation aggregation = Aggregation.newAggregation(match, lookup);

  // Kết quả trả về thường là Map hoặc một DTO mở rộng
  List<Document> results = mongoTemplate.aggregate(aggregation, "user", Document.class).getMappedResults();
  ```

* **Shell (Mongo Terminal):**

  ```javascript
  db.user.aggregate([
      {
          $match: { "email": "test@gmail.com" }
      },
      {
          $lookup: {
              from: "audit_log",
              localField: "_id",     // id của user
              foreignField: "userId", // field trong audit_log liên kết về user
              as: "logs"             // Kết quả trả về mảng log nằm trong user
          }
      }
  ])
  ```

-----

### VII. Aggregation: Group By (Thống kê)

**Bài toán:** Đếm xem có bao nhiêu User đăng ký bằng `GOOGLE` và bao nhiêu bằng `LOCAL`.
(Dữ liệu nằm trong mảng `providers.provider`).

* **Template:**

  ```java
  // 1. Unwind: "Duỗi" mảng providers ra để mỗi provider thành 1 dòng riêng
  UnwindOperation unwind = Aggregation.unwind("providers");

  // 2. Group: Nhóm theo provider name và đếm
  GroupOperation group = Aggregation.group("providers.provider").count().as("total");

  Aggregation agg = Aggregation.newAggregation(unwind, group);
  AggregationResults<Document> results = mongoTemplate.aggregate(agg, "user", Document.class);
  ```

* **Shell (Mongo Terminal):**

  ```javascript
  db.user.aggregate([
      { $unwind: "$providers" }, // Tách mảng ra từng dòng
      {
          $group: {
              _id: "$providers.provider", // Group theo loại provider
              total: { $sum: 1 }          // Đếm
          }
      }
  ])
  ```

  *Kết quả VD:* `[ { "_id": "GOOGLE", "total": 5 }, { "_id": "LOCAL", "total": 10 } ]`

### Tóm tắt nhanh cú pháp

| Tính năng | Java MongoTemplate | Mongo Shell |
| :--- | :--- | :--- |
| **Filter** | `Criteria.where("key").is(val)` | `{ "key": val }` |
| **Like** | `.regex("val")` | `/val/` |
| **Select** | `query.fields().include("key")` | `find({}, {"key": 1})` |
| **Sort** | `Sort.by(...)` | `.sort({"key": 1})` |
| **Join** | `LookupOperation` | `$lookup` |
| **Group** | `Aggregation.group(...)` | `$group` |