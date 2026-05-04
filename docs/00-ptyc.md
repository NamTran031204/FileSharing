<!-- TOC -->
  * [Thiết kế luồng nghiệp vụ chi tiết hơn cho phần 3. Feature List](#thiết-kế-luồng-nghiệp-vụ-chi-tiết-hơn-cho-phần-3-feature-list)
* [0. Nguyên tắc nghiệp vụ gốc cần bám](#0-nguyên-tắc-nghiệp-vụ-gốc-cần-bám)
  * [0.1. Version-centric](#01-version-centric)
  * [0.2. Asset là “media logic”, metadata/version là “file cụ thể”](#02-asset-là-media-logic-metadataversion-là-file-cụ-thể)
  * [0.3. Review session gắn với một version](#03-review-session-gắn-với-một-version)
  * [0.4. Soft delete thay vì hard delete](#04-soft-delete-thay-vì-hard-delete)
* [1. Feature List chi tiết theo module CRUD](#1-feature-list-chi-tiết-theo-module-crud)
* [1. Module User & Auth](#1-module-user--auth)
  * [1.1. Collection liên quan](#11-collection-liên-quan)
  * [1.2. CRUD nghiệp vụ](#12-crud-nghiệp-vụ)
    * [Create User](#create-user)
    * [Read User](#read-user)
    * [Update User](#update-user)
    * [Delete User](#delete-user)
* [2. Module Project](#2-module-project)
  * [2.1. Collection liên quan](#21-collection-liên-quan)
  * [2.2. CRUD nghiệp vụ](#22-crud-nghiệp-vụ)
  * [Create Project](#create-project)
    * [Mục tiêu](#mục-tiêu)
    * [Actor](#actor)
    * [Input](#input)
    * [Luồng nghiệp vụ](#luồng-nghiệp-vụ)
    * [Rule](#rule)
    * [DB write](#db-write)
  * [Read Project](#read-project)
    * [Các kiểu đọc](#các-kiểu-đọc)
    * [List project](#list-project)
    * [Detail project](#detail-project)
    * [Rule](#rule-1)
  * [Update Project](#update-project)
    * [Các hành động update](#các-hành-động-update)
    * [Actor](#actor-1)
    * [Luồng update metadata](#luồng-update-metadata)
    * [Rule](#rule-2)
    * [DB write](#db-write-1)
  * [Delete Project](#delete-project)
    * [Bản chất](#bản-chất)
    * [Luồng](#luồng)
    * [Rule](#rule-3)
* [3. Module Project Collaborator & Permission](#3-module-project-collaborator--permission)
  * [3.1. Collection liên quan](#31-collection-liên-quan)
  * [3.2. Mapping role sang permission](#32-mapping-role-sang-permission)
  * [Create Collaborator](#create-collaborator)
    * [Mục tiêu](#mục-tiêu-1)
    * [Input](#input-1)
    * [Luồng](#luồng-1)
    * [Rule](#rule-4)
  * [Read Collaborators](#read-collaborators)
    * [Luồng](#luồng-2)
    * [Rule](#rule-5)
  * [Update Collaborator](#update-collaborator)
    * [Hành động](#hành-động)
    * [Luồng](#luồng-3)
    * [Rule](#rule-6)
  * [Delete Collaborator](#delete-collaborator)
    * [Luồng](#luồng-4)
    * [Rule](#rule-7)
* [4. Module Folder](#4-module-folder)
  * [4.1. Collection liên quan](#41-collection-liên-quan)
  * [Create Folder](#create-folder)
    * [Actor](#actor-2)
    * [Input](#input-2)
    * [Luồng](#luồng-5)
    * [Rule](#rule-8)
  * [Read Folder](#read-folder)
    * [Các kiểu đọc](#các-kiểu-đọc-1)
    * [Query](#query)
    * [Rule](#rule-9)
  * [Update Folder](#update-folder)
    * [Hành động](#hành-động-1)
    * [Luồng rename](#luồng-rename)
    * [Rule](#rule-10)
  * [Delete Folder](#delete-folder)
    * [Bản chất](#bản-chất-1)
    * [Luồng](#luồng-6)
    * [Gợi ý MVP](#gợi-ý-mvp)
* [5. Module Asset & Media Version](#5-module-asset--media-version)
  * [5.1. Collection liên quan](#51-collection-liên-quan)
  * [5.2. CRUD Asset](#52-crud-asset)
  * [Create Asset](#create-asset)
    * [Khi nào create asset?](#khi-nào-create-asset)
    * [Actor](#actor-3)
    * [Input](#input-3)
    * [Luồng nghiệp vụ tổng quát](#luồng-nghiệp-vụ-tổng-quát)
    * [DB write](#db-write-2)
    * [Rule](#rule-11)
  * [Read Asset](#read-asset)
    * [Các kiểu đọc](#các-kiểu-đọc-2)
    * [List asset](#list-asset)
    * [Asset detail](#asset-detail)
    * [Rule](#rule-12)
  * [Update Asset](#update-asset)
    * [Các hành động update asset](#các-hành-động-update-asset)
    * [Luồng update metadata asset](#luồng-update-metadata-asset)
    * [Luồng move asset](#luồng-move-asset)
    * [Rule](#rule-13)
  * [Delete Asset](#delete-asset)
    * [Bản chất](#bản-chất-2)
    * [Luồng](#luồng-7)
    * [Rule](#rule-14)
  * [5.3. CRUD Media Version](#53-crud-media-version)
  * [Create Version](#create-version)
    * [Khi nào create version?](#khi-nào-create-version)
    * [Actor](#actor-4)
    * [Input](#input-4)
    * [Luồng](#luồng-8)
    * [Rule](#rule-15)
  * [Read Version](#read-version)
    * [Các kiểu đọc](#các-kiểu-đọc-3)
    * [Rule](#rule-16)
  * [Update Version](#update-version)
    * [Các field có thể update](#các-field-có-thể-update)
    * [Rule](#rule-17)
  * [Delete Version](#delete-version)
    * [Bản chất](#bản-chất-3)
    * [Luồng](#luồng-9)
    * [Rule](#rule-18)
* [6. Module Processing & Playback](#6-module-processing--playback)
  * [6.1. Collection liên quan](#61-collection-liên-quan)
  * [Create Processing Job](#create-processing-job)
    * [Khi nào tạo?](#khi-nào-tạo)
    * [Luồng](#luồng-10)
    * [Rule](#rule-19)
  * [Read Processing Job](#read-processing-job)
  * [Update Processing Job](#update-processing-job)
  * [Delete/Cancel Processing Job](#deletecancel-processing-job)
  * [Playback](#playback)
    * [Read playback data](#read-playback-data)
* [7. Module Annotation](#7-module-annotation)
  * [7.1. Collection liên quan](#71-collection-liên-quan)
  * [Create Annotation](#create-annotation)
    * [Có 2 loại MVP](#có-2-loại-mvp)
  * [Create TIMECODE Annotation](#create-timecode-annotation)
    * [Actor](#actor-5)
    * [Input](#input-5)
    * [Luồng](#luồng-11)
    * [Rule](#rule-20)
  * [Create REGION Annotation](#create-region-annotation)
    * [Input](#input-6)
    * [Luồng](#luồng-12)
    * [Rule](#rule-21)
  * [Read Annotation](#read-annotation)
    * [Các kiểu đọc](#các-kiểu-đọc-4)
    * [Query chính](#query-chính)
    * [Luồng](#luồng-13)
    * [Rule](#rule-22)
  * [Update Annotation](#update-annotation)
    * [Các hành động update](#các-hành-động-update-1)
    * [Actor](#actor-6)
    * [Luồng sửa vùng annotation](#luồng-sửa-vùng-annotation)
    * [Rule](#rule-23)
  * [Delete Annotation](#delete-annotation)
    * [Gợi ý MVP](#gợi-ý-mvp-1)
* [8. Module Comment Thread](#8-module-comment-thread)
  * [8.1. Collection liên quan](#81-collection-liên-quan)
  * [Create Comment Thread](#create-comment-thread)
    * [Trường hợp 1: Thread có annotation](#trường-hợp-1-thread-có-annotation)
    * [Trường hợp 2: General comment](#trường-hợp-2-general-comment)
    * [Luồng](#luồng-14)
  * [Read Comment Thread](#read-comment-thread)
    * [Các kiểu đọc](#các-kiểu-đọc-5)
    * [Query](#query-1)
    * [Rule](#rule-24)
  * [Update Comment Thread](#update-comment-thread)
    * [Các hành động update](#các-hành-động-update-2)
  * [Add Reply](#add-reply)
    * [Input](#input-7)
    * [Luồng](#luồng-15)
    * [Rule](#rule-25)
  * [Edit Comment](#edit-comment)
    * [Luồng](#luồng-16)
    * [Rule](#rule-26)
  * [Resolve Thread](#resolve-thread)
    * [Luồng](#luồng-17)
    * [Rule](#rule-27)
  * [Reopen Thread](#reopen-thread)
    * [Luồng](#luồng-18)
  * [Delete Comment Thread](#delete-comment-thread)
    * [Gợi ý MVP](#gợi-ý-mvp-2)
* [9. Module Review Session](#9-module-review-session)
  * [9.1. Collection liên quan](#91-collection-liên-quan)
  * [Create Review Session](#create-review-session)
    * [Khi nào tạo?](#khi-nào-tạo-1)
    * [Actor](#actor-7)
    * [Input](#input-8)
    * [Luồng](#luồng-19)
    * [Rule](#rule-28)
  * [Read Review Session](#read-review-session)
    * [Các kiểu đọc](#các-kiểu-đọc-6)
    * [Query](#query-2)
    * [Rule](#rule-29)
  * [Update Review Session Metadata](#update-review-session-metadata)
    * [Hành động](#hành-động-2)
    * [Actor](#actor-8)
    * [Luồng](#luồng-20)
    * [Rule](#rule-30)
  * [Update Review Status](#update-review-status)
    * [Status transition](#status-transition)
    * [Luồng Start Review](#luồng-start-review)
    * [Luồng Request Changes](#luồng-request-changes)
    * [Luồng Approve](#luồng-approve)
    * [Rule](#rule-31)
  * [Delete Review Session](#delete-review-session)
    * [Gợi ý](#gợi-ý)
* [10. Module Share Link](#10-module-share-link)
  * [10.1. Collection liên quan](#101-collection-liên-quan)
  * [Create Share Link](#create-share-link)
    * [Actor](#actor-9)
    * [Input](#input-9)
    * [Luồng](#luồng-21)
    * [Rule](#rule-32)
  * [Read Share Link](#read-share-link)
    * [Luồng](#luồng-22)
    * [Rule](#rule-33)
  * [Update Share Link](#update-share-link)
    * [Hành động](#hành-động-3)
    * [Rule](#rule-34)
  * [Delete/Revoke Share Link](#deleterevoke-share-link)
    * [Luồng](#luồng-23)
* [11. Module Notification](#11-module-notification)
  * [11.1. Collection liên quan](#111-collection-liên-quan)
  * [Create Notification](#create-notification)
    * [Event tạo notification](#event-tạo-notification)
    * [Luồng](#luồng-24)
    * [Rule](#rule-35)
  * [Read Notification](#read-notification)
  * [Update Notification](#update-notification)
  * [Delete Notification](#delete-notification)
* [12. Module Audit Log](#12-module-audit-log)
  * [12.1. Collection liên quan](#121-collection-liên-quan)
  * [Create Audit Log](#create-audit-log)
    * [Các event bắt buộc](#các-event-bắt-buộc)
    * [Rule](#rule-36)
  * [Read Audit Log](#read-audit-log)
    * [Actor](#actor-10)
    * [Query](#query-3)
    * [Rule](#rule-37)
  * [Update/Delete Audit Log](#updatedelete-audit-log)
* [14. Bảng CRUD tổng hợp theo collection](#14-bảng-crud-tổng-hợp-theo-collection)
* [15. Những điểm cần chỉnh nhẹ trong database để bớt vướng khi code](#15-những-điểm-cần-chỉnh-nhẹ-trong-database-để-bớt-vướng-khi-code)
  * [15.1. Thống nhất tên collection](#151-thống-nhất-tên-collection)
  * [15.2. `comment_threads` nên có `versionId`](#152-comment_threads-nên-có-versionid)
  * [15.3. `asset` nên có soft delete fields](#153-asset-nên-có-soft-delete-fields)
  * [15.4. Review session nên cân nhắc thêm `CANCELLED`](#154-review-session-nên-cân-nhắc-thêm-cancelled)
  * [15.5. Permission nên gom về một service](#155-permission-nên-gom-về-một-service)
* [16. Thứ tự triển khai CRUD nên làm](#16-thứ-tự-triển-khai-crud-nên-làm)
<!-- TOC -->

Thiết kế luồng nghiệp vụ chi tiết hơn cho phần 3. Feature List
---

# 0. Nguyên tắc nghiệp vụ gốc cần bám

Trước khi đi vào CRUD, có 4 nguyên tắc nên coi là “luật nền” của toàn hệ thống:

## 0.1. Version-centric

Mọi feedback quan trọng phải gắn với **version cụ thể**.

Điều này nghĩa là:

```text
Asset A
 ├── Version 1
 │    ├── annotations
 │    └── comment_threads
 └── Version 2
      ├── annotations
      └── comment_threads
```

Không được để comment/annotation chỉ gắn với `assetId` mà thiếu `versionId`, vì sẽ gây nhầm feedback giữa bản cũ và bản mới. Database của bạn cũng đã ghi rõ nguyên tắc: annotation/comment gắn với `versionId` để tránh nhầm lẫn khi có nhiều phiên bản. 

---

## 0.2. Asset là “media logic”, metadata/version là “file cụ thể”

Trong database hiện tại, bạn có:

```text
asset
metadata / media_versions
media_renditions
```

Nên hiểu nghiệp vụ như sau:

| Thành phần                    | Ý nghĩa nghiệp vụ                                             |
| ----------------------------- | ------------------------------------------------------------- |
| `asset`                       | Một sản phẩm media cần review, ví dụ “TVC Pepsi 30s”          |
| `metadata` / `media_versions` | Một file cụ thể của asset, ví dụ v1, v2, v3                   |
| `media_renditions`            | Các bản sinh ra để xem/playback, ví dụ HLS, thumbnail, poster |

Ví dụ:

```text
Asset: TVC_Pepsi_30s
 ├── Version 1: tvc_pepsi_v1.mp4
 │    ├── HLS 360p
 │    ├── HLS 720p
 │    └── poster
 └── Version 2: tvc_pepsi_v2.mp4
      ├── HLS 360p
      ├── HLS 720p
      └── poster
```

---

## 0.3. Review session gắn với một version

Một `review_session` nên gắn với đúng một `versionId`.

Không nên dùng một review session cho nhiều version, vì khi version mới được upload sau `REQUEST_CHANGES`, đó nên được xem là một vòng review mới.

---

## 0.4. Soft delete thay vì hard delete

Các collection như `projects`, `folder`, `metadata` đã có `isActive`, `isTrash`, `trashedAt`. Vì vậy nghiệp vụ CRUD nên ưu tiên:

```text
Delete = chuyển isActive = false hoặc isTrash = true
```

Không nên xóa cứng ngay, trừ khi có job cleanup hoặc TTL.

---

# 1. Feature List chi tiết theo module CRUD

---

# 1. Module User & Auth

## 1.1. Collection liên quan

```text
users
audit_logs
notifications
```

`users` đang lưu thông tin xác thực, role hệ thống, trạng thái enabled/emailVerified và notification preferences. 

---

## 1.2. CRUD nghiệp vụ

### Create User

Tạo user khi:

```text
- Đăng ký bằng email/password
- Đăng nhập OAuth lần đầu
- Owner mời email mới vào project, sau đó user hoàn tất đăng ký
```

Dữ liệu tạo:

```text
email
password hash
publicUserName
roles = ["USER"]
enabled = true
emailVerified = false hoặc true nếu OAuth
providers
metadata
notificationPreferences
createdAt
updatedAt
```

Rule:

```text
- Email là unique.
- Password không lưu plain text.
- User mới mặc định không phải ADMIN.
- Nếu đăng ký qua Google, thêm provider GOOGLE.
```

Audit:

```text
action = CREATE
targetType = USER
```

---

### Read User

Các tình huống đọc user:

```text
- Lấy thông tin user hiện tại: /me
- Tìm user để mời vào project
- Hiển thị danh sách collaborator
- Hiển thị tên/avatar người comment
```

Rule:

```text
- User thường chỉ xem public profile của user khác.
- Admin có thể xem nhiều thông tin hơn.
- Không trả về password.
```

---

### Update User

Các trường user có thể tự sửa:

```text
publicUserName
metadata.avatar
metadata.locale
metadata.timezone
notificationPreferences
```

Các trường chỉ admin/system sửa:

```text
roles
enabled
emailVerified
```

Rule:

```text
- User không tự nâng role thành ADMIN.
- User disabled không được đăng nhập.
```

Audit:

```text
action = UPDATE
targetType = USER
```

---

### Delete User

Với dự án này, nên dùng disable thay vì xóa:

```text
enabled = false
updatedAt = now
```

Rule:

```text
- Không xóa cứng user nếu user đã tạo comment, annotation, review session.
- Các comment cũ vẫn giữ createdByEmail/createdByName dạng denormalized để hiển thị lịch sử.
```

---

# 2. Module Project

## 2.1. Collection liên quan

```text
projects
folder
asset
audit_logs
notifications
```

`projects` là nơi chứa folder và asset, có owner, collaborators, stats, status và soft delete. 

---

## 2.2. CRUD nghiệp vụ

## Create Project

### Mục tiêu

Owner tạo một workspace để quản lý asset media.

### Actor

```text
User đã đăng nhập
```

### Input

```text
projectName
projectCode
description
startDate
endDate
```

### Luồng nghiệp vụ

```text
1. User bấm Create Project.
2. Nhập thông tin project.
3. Backend validate dữ liệu.
4. Backend kiểm tra projectCode unique.
5. Backend tạo document projects.
6. Set ownerId = currentUser.userId.
7. Set ownerEmail = currentUser.email.
8. Set collaborators = [] hoặc thêm owner vào collaborators nếu muốn.
9. Set stats mặc định:
   - folderCount = 0
   - assetCount = 0
   - totalVersions = 0
   - pendingReviews = 0
10. Set status = ACTIVE.
11. Set isActive = true.
12. Ghi audit log CREATE PROJECT.
13. Trả về project vừa tạo.
```

### Rule

```text
PROJECT_CREATE_01: projectName bắt buộc.
PROJECT_CREATE_02: projectCode bắt buộc và không trùng.
PROJECT_CREATE_03: endDate nếu có thì phải >= startDate.
PROJECT_CREATE_04: User tạo project là owner.
```

### DB write

```text
insert into projects
insert into audit_logs
```

---

## Read Project

### Các kiểu đọc

```text
1. List projects của user.
2. Xem chi tiết một project.
3. Xem project qua quyền collaborator.
4. Admin xem project.
```

### List project

Điều kiện query:

```text
ownerId = currentUser.userId
OR collaborators.userId = currentUser.userId
AND isActive = true
```

Filter:

```text
status
keyword projectName/projectCode
```

Sort:

```text
updatedAt desc
createdAt desc
projectName asc
```

### Detail project

Luồng:

```text
1. User mở /projects/:projectId.
2. Backend tìm project theo projectId.
3. Nếu không tồn tại hoặc isActive = false -> RESOURCE_NOT_FOUND.
4. Kiểm tra user là owner hoặc collaborator.
5. Nếu không có quyền -> PERMISSION_DENIED.
6. Trả về project detail.
7. Có thể kèm folder root và asset root.
```

### Rule

```text
PROJECT_READ_01: User chỉ xem project mình sở hữu hoặc được mời.
PROJECT_READ_02: Project isActive = false không hiển thị ở danh sách thường.
```

---

## Update Project

### Các hành động update

```text
- Đổi projectName
- Đổi description
- Đổi startDate/endDate
- Đổi status: ACTIVE / ARCHIVED / COMPLETED
- Cập nhật collaborators
```

### Actor

```text
Owner
Admin
```

### Luồng update metadata

```text
1. Owner mở Project Settings.
2. Sửa thông tin project.
3. Backend kiểm tra quyền OWNER.
4. Backend validate field.
5. Update projects.
6. Ghi audit log UPDATE PROJECT.
7. Trả về project mới.
```

### Rule

```text
PROJECT_UPDATE_01: Chỉ owner/admin được sửa project metadata.
PROJECT_UPDATE_02: Không đổi projectCode nếu đã có asset/review? 
```

Gợi ý: MVP nên **không cho đổi `projectCode`** sau khi tạo, để tránh ảnh hưởng downloadFileName/link/truy vết.

### DB write

```text
update projects
insert audit_logs
```

---

## Delete Project

### Bản chất

Soft delete.

### Luồng

```text
1. Owner chọn Delete Project.
2. Hệ thống cảnh báo project có asset/folder/review.
3. Owner xác nhận.
4. Backend kiểm tra quyền OWNER.
5. Update project:
   - isActive = false
   - trashedAt = now
6. Có thể update folder/asset liên quan thành isActive=false hoặc isTrash=true theo policy.
7. Ghi audit log DELETE PROJECT.
```

### Rule

```text
PROJECT_DELETE_01: Chỉ Owner/Admin được xóa project.
PROJECT_DELETE_02: Delete project không xóa cứng asset ngay.
PROJECT_DELETE_03: Project bị xóa không còn hiển thị với collaborator.
```

---

# 3. Module Project Collaborator & Permission

## 3.1. Collection liên quan

```text
projects.collaborators
folder.permissions
metadata.userPermissions
asset
audit_logs
notifications
```

MVP đã yêu cầu permission enforcement cho `READ / COMMENT / MODIFY / OWNER` và share link an toàn theo quyền. 

---

## 3.2. Mapping role sang permission

Nên chốt mapping đơn giản:

| Project role | Permission mặc định                  |
| ------------ | ------------------------------------ |
| `VIEWER`     | `READ`                               |
| `REVIEWER`   | `READ`, `COMMENT`                    |
| `PRODUCER`   | `READ`, `COMMENT`, `MODIFY`          |
| `OWNER`      | `READ`, `COMMENT`, `MODIFY`, `OWNER` |

Trong DB, `projects.collaborators.role` đang là:

```text
PRODUCER | REVIEWER | VIEWER
```

Còn owner lấy từ `ownerId`.

Guest/Viewer qua share link là vãng lai, không nằm trong collaborators và không có quyền `COMMENT`.

---

## Create Collaborator

### Mục tiêu

Owner/Producer mời người khác vào project.

### Input

```text
email
role: PRODUCER | REVIEWER | VIEWER
```

### Luồng

```text
1. Owner/Producer mở Project Settings.
2. Nhập email.
3. Chọn role.
4. Backend kiểm tra currentUser là owner hoặc producer của project.
5. Backend tìm user theo email.
6. Nếu user tồn tại:
   - add vào projects.collaborators
   - userId = foundUser.userId
7. Nếu user chưa tồn tại:
   - có thể lưu email, userId = null nếu schema cho phép
   - hoặc yêu cầu user phải tồn tại trước
8. Tạo notification REVIEW_INVITATION nếu user tồn tại.
9. Ghi audit log PERMISSION_CHANGE.
```

### Rule

```text
COLLAB_CREATE_01: Chỉ Owner/Producer được thêm collaborator.
COLLAB_CREATE_02: Không thêm trùng email trong cùng project.
COLLAB_CREATE_03: Không thêm chính owner như collaborator thường.
COLLAB_CREATE_04: Role phải thuộc VIEWER / REVIEWER / PRODUCER.
```

---

## Read Collaborators

### Luồng

```text
1. User mở Project Settings hoặc Project Members.
2. Backend kiểm tra user có READ project.
3. Trả về danh sách collaborators + owner.
```

### Rule

```text
COLLAB_READ_01: Thành viên project được xem danh sách collaborator.
COLLAB_READ_02: Guest qua share link không được xem full collaborators.
```

---

## Update Collaborator

### Hành động

```text
- Đổi role VIEWER -> REVIEWER
- Đổi role REVIEWER -> PRODUCER
- Hạ quyền PRODUCER -> VIEWER
```

### Luồng

```text
1. Owner/Producer chọn collaborator.
2. Đổi role.
3. Backend kiểm tra user là owner hoặc producer.
4. Backend update projects.collaborators.$.role.
5. Ghi audit log PERMISSION_CHANGE.
6. Gửi notification nếu cần.
```

### Rule

```text
COLLAB_UPDATE_01: Chỉ owner/producer được đổi role.
COLLAB_UPDATE_02: Không dùng API này để đổi owner.
COLLAB_UPDATE_03: Nếu user đang trong active review session, đổi quyền chỉ ảnh hưởng các request sau đó.
```

---

## Delete Collaborator

### Luồng

```text
1. Owner/Producer bấm Remove collaborator.
2. Backend kiểm tra user là owner hoặc producer.
3. Xóa collaborator khỏi projects.collaborators.
4. Có thể xóa/giữ permission override ở folder/metadata tùy policy.
5. Ghi audit log PERMISSION_CHANGE.
```

### Rule

```text
COLLAB_DELETE_01: Chỉ owner/producer được remove collaborator.
COLLAB_DELETE_02: Remove collaborator không xóa comment/annotation cũ của user.
COLLAB_DELETE_03: Sau khi bị remove, user không còn READ project.
```

---

# 4. Module Folder

## 4.1. Collection liên quan

```text
folder
projects.stats
asset.folderId
audit_logs
```

`folder` dùng để tổ chức asset trong project, có `projectId`, `parentFolderId`, `folderPath`, `level`, permissions override, stats và `isActive`. 

---

## Create Folder

### Actor

```text
Owner
Producer
```

### Input

```text
projectId
parentFolderId
folderName
description
```

### Luồng

```text
1. User ở Project Detail bấm Create Folder.
2. Chọn parent folder hoặc root.
3. Backend kiểm tra user có MODIFY trên project/folder cha.
4. Validate folderName.
5. Nếu có parentFolderId:
   - lấy parent folder
   - tính level = parent.level + 1
   - tính folderPath = parent.folderPath + "/" + folderName
6. Nếu root:
   - level = 1
   - folderPath = folderName
7. Insert folder.
8. Tăng projects.stats.folderCount.
9. Nếu có parent folder, tăng parent.stats.subfoldersCount.
10. Ghi audit log CREATE.
```

### Rule

```text
FOLDER_CREATE_01: folderName bắt buộc.
FOLDER_CREATE_02: Cùng một parent không được có 2 folder trùng tên.
FOLDER_CREATE_03: User phải có MODIFY.
FOLDER_CREATE_04: Không tạo folder trong project ARCHIVED/COMPLETED nếu policy khóa chỉnh sửa.
```

---

## Read Folder

### Các kiểu đọc

```text
- List folder con của project/root.
- List folder con của một folder.
- Breadcrumb từ folder hiện tại.
- Xem folder detail.
```

### Query

```text
projectId = currentProject
parentFolderId = selectedParentFolderId
isActive = true
```

### Rule

```text
FOLDER_READ_01: User phải có READ project.
FOLDER_READ_02: Nếu folder có permission override, ưu tiên check override.
```

---

## Update Folder

### Hành động

```text
- Rename folder
- Đổi description
- Move folder sang parent khác
- Update permissions override (OWNER)
```

### Luồng rename

```text
1. User đổi folderName.
2. Backend kiểm tra MODIFY.
3. Kiểm tra không trùng tên trong cùng parent.
4. Update folderName.
5. Tính lại folderPath của folder hiện tại.
6. Tính lại folderPath của toàn bộ folder con.
7. Ghi audit log UPDATE.
```

### Rule

```text
FOLDER_UPDATE_01: User phải có MODIFY với rename/description/move.
FOLDER_UPDATE_02: Không được move folder vào chính nó hoặc folder con của nó.
FOLDER_UPDATE_03: Move folder phải cập nhật folderPath và level của toàn bộ subtree.
FOLDER_UPDATE_04: Update permissions override chỉ Owner được làm.
```

---

## Delete Folder

### Bản chất

Soft delete.

### Luồng

```text
1. User chọn Delete Folder.
2. Backend kiểm tra MODIFY.
3. Kiểm tra folder có asset/subfolder không.
4. Nếu folder rỗng:
   - isActive = false
5. Nếu folder không rỗng:
   - MVP nên chặn xóa hoặc yêu cầu xóa đệ quy có xác nhận.
6. Giảm projects.stats.folderCount nếu cần.
7. Ghi audit log DELETE.
```

### Gợi ý MVP

```text
Không cho xóa folder không rỗng.
```

Rule này giúp tránh phức tạp khi xử lý asset bên trong.

---

# 5. Module Asset & Media Version

Đây là module lõi nhất.

## 5.1. Collection liên quan

```text
asset
metadata / media_versions
media_renditions
processing_jobs
review_sessions
annotations
comment_threads
audit_logs
notifications
projects.stats
folder.stats
```

Database hiện có `asset` lưu thông tin asset logic như `assetName`, `projectId`, `folderId`, `versionCount`, `assetStatus`, `latestReviewSessionId`, `shareToken`, `shareExpiry`; còn `metadata` lưu thông tin version/file như `fileName`, `objectName`, `assetId`, `versionNumber`, `mediaType`, `uploadId`, `status`, `processingStatus`, `mediaInfo`, permissions và soft delete. 

---

## 5.2. CRUD Asset

## Create Asset

### Khi nào create asset?

Khi producer upload file lần đầu.

### Actor

```text
Owner
Producer
```

### Input

```text
projectId
folderId optional
file
assetName optional
description optional
```

### Luồng nghiệp vụ tổng quát

```text
1. User chọn Upload Media trong project/folder.
2. Backend kiểm tra user có MODIFY.
3. Backend validate file type: VIDEO / IMAGE / DESIGN.
4. Backend tạo asset.
5. Backend tạo metadata/version đầu tiên với versionNumber = 1.
6. Backend tạo upload session hoặc uploadId.
7. Client upload file lên storage.
8. Khi upload complete:
   - metadata.status = COMPLETED
   - nếu VIDEO: tạo processing_jobs
   - nếu IMAGE: processingStatus có thể READY ngay
9. Cập nhật asset.versionCount = 1.
10. Cập nhật projects.stats.assetCount += 1.
11. Cập nhật projects.stats.totalVersions += 1.
12. Nếu có folderId, cập nhật folder.stats.assetCount += 1.
13. Ghi audit log UPLOAD_COMPLETE.
14. Trả về asset + version.
```

### DB write

```text
insert asset
insert metadata
insert processing_jobs nếu video
update projects.stats
update folder.stats nếu có
insert audit_logs
```

### Rule

```text
ASSET_CREATE_01: User phải có MODIFY trên project/folder.
ASSET_CREATE_02: File đầu tiên tạo asset và version 1.
ASSET_CREATE_03: assetName mặc định = fileName.
ASSET_CREATE_04: assetStatus mặc định = DRAFT.
ASSET_CREATE_05: version.status ban đầu = UPLOADING.
ASSET_CREATE_06: version.status sau upload complete = COMPLETED.
ASSET_CREATE_07: Video upload complete phải sinh processing job.
ASSET_CREATE_08: Image có thể READY ngay nếu không cần processing.
```

---

## Read Asset

### Các kiểu đọc

```text
- List asset trong project/folder.
- Xem asset detail.
- Xem latest version.
- Xem một version cụ thể.
- Xem version history.
- Xem asset qua share link.
```

### List asset

Query:

```text
asset.projectId = projectId
asset.folderId = folderId optional
asset.isActive != false nếu có
```

Join/load thêm:

```text
latest metadata/version
latest review session
open comment count nếu cần
```

Filter:

```text
mediaType
assetStatus
ownerId
folderId
keyword assetName
```

Sort:

```text
updatedAt desc
createdAt desc
assetName asc
```

### Asset detail

Luồng:

```text
1. User mở asset.
2. Backend tìm asset.
3. Kiểm tra READ thông qua:
   - ownerId
   - project collaborator
   - folder permission override
   - metadata.userPermissions nếu dùng cấp file
   - share token nếu truy cập public link
4. Lấy latest version:
   - assetId = asset.assetId
   - status = COMPLETED
   - sort versionNumber desc
5. Lấy review session mới nhất nếu có.
6. Trả về asset detail.
```

### Rule

```text
ASSET_READ_01: Không có READ thì không xem được asset.
ASSET_READ_02: Version FAILED không nên được chọn làm latest reviewable version.
ASSET_READ_03: Comment/annotation load theo version đang chọn, không load lẫn version.
```

---

## Update Asset

### Các hành động update asset

```text
- Đổi assetName
- Đổi description
- Move asset sang folder khác
- Đổi assetStatus thông qua review workflow
- Cập nhật shareToken/shareExpiry
```

### Luồng update metadata asset

```text
1. User sửa assetName/description.
2. Backend kiểm tra MODIFY.
3. Update asset.
4. Ghi audit log UPDATE ASSET.
```

### Luồng move asset

```text
1. User chọn Move asset.
2. Chọn folder đích.
3. Backend kiểm tra MODIFY ở folder hiện tại và folder đích.
4. Update asset.folderId.
5. Giảm folder.stats.assetCount ở folder cũ.
6. Tăng folder.stats.assetCount ở folder mới.
7. Ghi audit log UPDATE.
```

### Rule

```text
ASSET_UPDATE_01: User phải có MODIFY.
ASSET_UPDATE_02: Không đổi assetStatus trực tiếp nếu status thuộc review workflow; nên đi qua review_session.
ASSET_UPDATE_03: Move asset không làm thay đổi version/comment/annotation.
```

---

## Delete Asset

### Bản chất

Soft delete.

### Luồng

```text
1. User chọn Delete Asset.
2. Backend kiểm tra MODIFY hoặc OWNER.
3. Update asset isActive=false nếu có, hoặc thêm field deleted/trashed nếu chưa có.
4. Update metadata của các version:
   - isTrash = true
   - trashedAt = now
5. Không xóa annotations/comment_threads ngay.
6. Giảm projects.stats.assetCount.
7. Ghi audit log DELETE ASSET.
```

### Rule

```text
ASSET_DELETE_01: Delete asset không xóa cứng version file ngay.
ASSET_DELETE_02: Asset bị delete không xuất hiện trong list thường.
ASSET_DELETE_03: Nếu asset đã APPROVED, có thể yêu cầu OWNER mới được delete.
```

---

## 5.3. CRUD Media Version

## Create Version

### Khi nào create version?

Khi producer upload bản sửa mới cho asset đã tồn tại.

### Actor

```text
Producer
Owner
```

### Input

```text
assetId
file
changeNote optional
```

### Luồng

```text
1. User mở asset.
2. Bấm Upload New Version.
3. Backend kiểm tra MODIFY.
4. Backend lấy asset.versionCount hiện tại.
5. Tạo metadata/version mới:
   - assetId = asset.assetId
   - versionNumber = asset.versionCount + 1
   - status = UPLOADING
   - processingStatus = PENDING nếu video
   - ownerId = currentUser
6. Client upload file.
7. Khi complete:
   - status = COMPLETED
   - nếu video tạo processing_jobs
   - nếu image set READY
8. Update asset.versionCount += 1.
9. Update asset.assetStatus:
   - nếu version mới để review ngay: IN_REVIEW
   - nếu chỉ upload nháp: DRAFT
10. Tạo notification NEW_VERSION cho reviewers nếu có active review.
11. Ghi audit log UPLOAD_COMPLETE.
```

### Rule

```text
VERSION_CREATE_01: User phải có MODIFY.
VERSION_CREATE_02: New version không ghi đè version cũ.
VERSION_CREATE_03: New version không tự copy annotation/comment của version cũ trong MVP.
VERSION_CREATE_04: New version phải cùng mediaType với version đầu tiên.
VERSION_CREATE_05: Review session mới nên được tạo cho version mới.
```

---

## Read Version

### Các kiểu đọc

```text
- List versions của asset
- Get version detail
- Get latest version
- Get playback data
- Download version
```

### Rule

```text
VERSION_READ_01: User phải có READ asset.
VERSION_READ_02: Version history hiển thị cả version cũ.
VERSION_READ_03: Chọn version nào thì load annotation/comment của version đó.
```

---

## Update Version

### Các field có thể update

Thông thường version/file không nên sửa nhiều. Có thể update:

```text
downloadFileName
processingStatus
processingError
mediaInfo
visibility/publicPermission nếu bạn đặt permission ở metadata
isTrash
```

### Rule

```text
VERSION_UPDATE_01: Không cho sửa versionNumber.
VERSION_UPDATE_02: Không cho đổi assetId.
VERSION_UPDATE_03: processingStatus nên do system/worker update.
VERSION_UPDATE_04: User update version chủ yếu là đổi downloadFileName hoặc permission.
```

---

## Delete Version

### Bản chất

Soft delete version.

### Luồng

```text
1. User chọn delete version.
2. Backend kiểm tra MODIFY/OWNER.
3. Kiểm tra version có phải version duy nhất không.
4. Nếu là version duy nhất, gợi ý delete asset thay vì delete version.
5. Update metadata:
   - isTrash = true
   - trashedAt = now
6. Không xóa annotation/comment ngay.
7. Ghi audit log DELETE FILE/VERSION.
```

### Rule

```text
VERSION_DELETE_01: Không xóa version duy nhất của asset nếu asset còn active.
VERSION_DELETE_02: Không cho xóa version đang được review IN_REVIEW, trừ Owner.
VERSION_DELETE_03: Version bị trash không xuất hiện mặc định trong version history.
```

---

# 6. Module Processing & Playback

## 6.1. Collection liên quan

```text
processing_jobs
media_renditions
metadata / media_versions
audit_logs
```

`media_renditions` lưu các bản HLS, thumbnail, sprite, waveform, poster; `processing_jobs` là queue cho transcode, thumbnail generation và các job xử lý media. 

---

## Create Processing Job

### Khi nào tạo?

```text
- Sau khi upload video complete
- Sau khi cần regenerate thumbnail/poster
```

### Luồng

```text
1. Upload video complete.
2. Backend tạo job TRANSCODE_HLS (MVP).
3. (MVP sau) Backend tạo job GENERATE_THUMBNAILS.
4. (MVP sau) Backend tạo job GENERATE_POSTER.
5. metadata.processingStatus = PENDING.
```

### Rule

```text
JOB_CREATE_01: Chỉ tạo job khi version.status = COMPLETED.
JOB_CREATE_02: Video cần HLS trước khi playback ổn định.
JOB_CREATE_03: Image có thể không cần transcode.
```

---

## Read Processing Job

Dành cho:

```text
- Frontend poll trạng thái xử lý.
- Admin/worker monitor job.
```

Rule:

```text
JOB_READ_01: User có READ version được xem processing status đơn giản.
JOB_READ_02: Chi tiết worker/error chỉ admin/system xem.
```

---

## Update Processing Job

Do worker thực hiện.

Luồng:

```text
1. Worker lấy job PENDING.
2. Update status = PROCESSING.
3. Update startedAt, workerId, workerHeartbeat.
4. Trong quá trình xử lý, update progress.
5. Nếu thành công:
   - tạo media_renditions
   - job.status = COMPLETED
   - version.processingStatus = READY nếu đủ rendition bắt buộc
6. Nếu lỗi:
   - job.status = FAILED
   - result.errorMessage
   - retryCount += 1
   - version.processingStatus = FAILED nếu hết retry
```

Rule:

```text
JOB_UPDATE_01: Worker chỉ nhận job PENDING.
JOB_UPDATE_02: Job FAILED có thể retry nếu retryCount < maxRetries.
JOB_UPDATE_03: Version READY khi các rendition bắt buộc đã READY.
```

---

## Delete/Cancel Processing Job

Luồng:

```text
1. System/Admin cancel job.
2. Update job.status = CANCELLED.
3. Nếu job đang ảnh hưởng version, update version processingStatus phù hợp.
```

Rule:

```text
JOB_DELETE_01: Không hard delete job đang PROCESSING.
JOB_DELETE_02: Chỉ admin/system được cancel.
```

---

## Playback

### Read playback data

Luồng:

```text
1. User mở video version.
2. Backend kiểm tra READ.
3. Backend kiểm tra version.status = COMPLETED.
4. Backend kiểm tra processingStatus.
5. Nếu READY:
   - trả HLS manifestKey
   - trả poster
   - trả sprite nếu có
6. Nếu PENDING/PROCESSING:
   - trả trạng thái processing.
7. Nếu FAILED:
   - trả lỗi PROCESSING_FAILED.
```

Rule:

```text
PLAYBACK_01: Chỉ video READY mới playback HLS.
PLAYBACK_02: Nếu image thì trả object URL/image URL.
PLAYBACK_03: Playback không load comment trực tiếp; comment load theo API annotation/comment.
```

---

# 7. Module Annotation

## 7.1. Collection liên quan

```text
annotations
comment_threads
review_sessions.metrics
notifications
audit_logs
```

`annotations` hiện hỗ trợ `TIMECODE`, `REGION`, `FRAME_REGION`, có `assetId`, `versionId`, `timeCode`, `region`, `status`, `threadId`, creator và indexes theo `versionId`, `status`, `timecode.startMs`. 

---

## Create Annotation

### Có 2 loại MVP

```text
1. TIMECODE cho video
2. REGION cho image
```

---

## Create TIMECODE Annotation

### Actor

```text
Reviewer
Producer
Owner
```

### Input

```text
assetId
versionId
annotationType = TIMECODE
timeCode.startMs
timeCode.endMs optional
commentContent
mentions optional
```

### Luồng

```text
1. User pause video tại một timestamp.
2. Nhập comment.
3. Client gửi create annotation + root comment.
4. Backend kiểm tra READ + COMMENT.
5. Backend kiểm tra version thuộc asset.
6. Backend kiểm tra mediaType = VIDEO.
7. Backend kiểm tra startMs nằm trong durationMs.
8. Insert annotation:
   - status = OPEN
   - createdBy = currentUser
   - createdByEmail = currentUser.email
9. Insert comment_thread:
   - assetId
   - versionId hoặc versionNumber nên bổ sung rõ
   - annotations = [annotationId]
   - rootComment
   - status = OPEN
10. Update annotation.threadId = threadId.
11. Update review_sessions.metrics:
   - totalAnnotations += 1
   - openAnnotations += 1
   - totalComments += 1
12. Tạo notification NEW_COMMENT/MENTION nếu cần.
13. Ghi audit log CREATE ANNOTATION/COMMENT.
14. Trả về annotation + thread.
```

### Rule

```text
ANNOTATION_CREATE_01: User phải có COMMENT.
ANNOTATION_CREATE_02: versionId bắt buộc.
ANNOTATION_CREATE_03: TIMECODE chỉ dùng cho VIDEO.
ANNOTATION_CREATE_04: startMs >= 0.
ANNOTATION_CREATE_05: startMs <= mediaInfo.durationMs.
ANNOTATION_CREATE_06: endMs nếu có phải >= startMs.
ANNOTATION_CREATE_07: Comment content không được rỗng.
```

---

## Create REGION Annotation

### Input

```text
assetId
versionId
annotationType = REGION
region.shape = RECTANGLE
region.points = [{x,y}, {x,y}]
commentContent
```

### Luồng

```text
1. User mở image review.
2. Chọn rectangle tool.
3. Kéo vùng cần feedback.
4. Nhập comment.
5. Backend kiểm tra quyền COMMENT.
6. Backend kiểm tra mediaType = IMAGE hoặc DESIGN.
7. Backend validate points normalized từ 0 đến 1.
8. Insert annotation.
9. Insert comment_thread.
10. Link annotation.threadId.
11. Update review session metrics.
12. Gửi notification nếu cần.
13. Ghi audit log.
```

### Rule

```text
ANNOTATION_REGION_01: REGION dùng cho IMAGE/DESIGN.
ANNOTATION_REGION_02: MVP chỉ cần RECTANGLE.
ANNOTATION_REGION_03: points phải có đúng 2 điểm nếu RECTANGLE.
ANNOTATION_REGION_04: x/y phải nằm trong [0,1].
```

---

## Read Annotation

### Các kiểu đọc

```text
- List annotation của version
- Filter OPEN/RESOLVED
- List annotation theo timecode
- Get annotation detail
```

### Query chính

```text
versionId = selectedVersionId
status optional
sort:
  - video: timeCode.startMs asc
  - image: createdAt asc
```

### Luồng

```text
1. User mở review screen.
2. Backend kiểm tra READ.
3. Backend lấy annotations theo versionId.
4. Backend lấy comment_threads liên quan hoặc frontend gọi riêng.
5. Trả về annotations.
```

### Rule

```text
ANNOTATION_READ_01: Chỉ đọc annotation của version đang chọn.
ANNOTATION_READ_02: Không load annotation của version cũ sang version mới.
```

---

## Update Annotation

### Các hành động update

```text
- Sửa region/timecode
- Sửa status OPEN/RESOLVED
- Link threadId sau khi tạo thread
```

### Actor

```text
Creator
Producer
Owner
```

### Luồng sửa vùng annotation

```text
1. User chọn annotation.
2. Kéo sửa vùng hoặc sửa timecode.
3. Backend kiểm tra quyền.
4. Validate lại region/timecode.
5. Update annotation.
6. Ghi audit log UPDATE ANNOTATION.
```

### Rule

```text
ANNOTATION_UPDATE_01: Creator có thể sửa annotation khi status = OPEN.
ANNOTATION_UPDATE_02: Owner/Producer có thể sửa nếu có MODIFY.
ANNOTATION_UPDATE_03: Annotation RESOLVED không nên sửa vị trí, trừ khi reopen.
```

---

## Delete Annotation

### Gợi ý MVP

Không hard delete. Có 2 lựa chọn:

```text
1. Không cho delete annotation, chỉ resolve.
2. Cho creator delete nếu chưa có reply.
```

Khuyến nghị:

```text
MVP: không delete annotation; dùng RESOLVED.
```

Nếu vẫn cần delete:

```text
1. User bấm delete annotation.
2. Backend kiểm tra creator hoặc OWNER.
3. Nếu thread có replies > 0, không cho delete.
4. Nếu chưa có replies:
   - delete annotation hoặc mark deleted
   - delete/hide comment_thread tương ứng
5. Ghi audit log DELETE.
```

Rule:

```text
ANNOTATION_DELETE_01: Không xóa feedback đã có thảo luận.
ANNOTATION_DELETE_02: Resolve là nghiệp vụ chính thay cho delete.
```

---

# 8. Module Comment Thread

## 8.1. Collection liên quan

```text
comment_threads
annotations
review_sessions.metrics
notifications
audit_logs
```

`comment_threads` có `rootComment`, `replies`, `replyCount`, `participants`, `lastActivityAt`, `status`, `resolvedAt`, `resolvedBy`; đây là cấu trúc phù hợp cho threaded discussion cơ bản. 

---

## Create Comment Thread

Thường được tạo cùng annotation.

### Trường hợp 1: Thread có annotation

```text
Video timecode comment
Image region comment
```

### Trường hợp 2: General comment

Có thể để sau MVP:

```text
Comment chung cho cả version, không gắn annotation.
```

### Luồng

```text
1. Backend tạo annotation trước.
2. Backend tạo comment_thread với rootComment.
3. comment_threads.annotations = [annotationId].
4. annotation.threadId = threadId.
```

Rule:

```text
THREAD_CREATE_01: User phải có COMMENT.
THREAD_CREATE_02: rootComment.content bắt buộc.
THREAD_CREATE_03: participants ban đầu gồm creator.
THREAD_CREATE_04: status mặc định OPEN.
```

---

## Read Comment Thread

### Các kiểu đọc

```text
- List thread theo version
- List thread theo annotation
- Get thread detail
- Filter OPEN/RESOLVED
- Search content
```

### Query

```text
assetId = assetId
versionId = versionId
status optional
```

Lưu ý: schema hiện tại trong `comment_threads` có field `version: Number`, nhưng index lại ghi `versionId`. Bạn nên chốt lại dùng **`versionId`** trong collection này để đồng bộ với annotation/review. Nếu chỉ lưu `versionNumber`, khi có nhiều asset sẽ dễ thiếu ngữ cảnh.

### Rule

```text
THREAD_READ_01: User phải có READ asset.
THREAD_READ_02: Thread list phải theo versionId.
THREAD_READ_03: Thread RESOLVED vẫn được xem.
```

---

## Update Comment Thread

### Các hành động update

```text
- Edit root comment
- Edit reply
- Add reply
- Resolve thread
- Reopen thread
```

---

## Add Reply

### Input

```text
threadId
replyToComment
content
mentions
attachments optional
```

### Luồng

```text
1. User nhập reply.
2. Backend kiểm tra COMMENT.
3. Backend tìm thread.
4. Nếu thread.status = RESOLVED:
   - MVP nên từ chối và yêu cầu reopen
5. Push reply vào replies.
6. replyCount += 1.
7. Add user vào participants nếu chưa có.
8. lastActivityAt = now.
9. review_sessions.metrics.totalComments += 1.
10. Tạo notification cho participants/mentions.
11. Ghi audit log CREATE COMMENT.
```

### Rule

```text
REPLY_CREATE_01: User phải có COMMENT.
REPLY_CREATE_02: Reply content không được rỗng.
REPLY_CREATE_03: Thread RESOLVED không được reply, trừ khi reopen.
```

---

## Edit Comment

### Luồng

```text
1. User bấm edit comment.
2. Backend kiểm tra comment.createdBy = currentUser hoặc OWNER.
3. Update content.
4. Set editedAt = now.
5. Ghi audit log UPDATE COMMENT.
```

### Rule

```text
COMMENT_UPDATE_01: Chỉ author hoặc owner được sửa comment.
COMMENT_UPDATE_02: Không cho sửa comment nếu thread RESOLVED, trừ Owner.
COMMENT_UPDATE_03: Không xóa lịch sử audit.
```

---

## Resolve Thread

### Luồng

```text
1. User bấm Resolve.
2. Backend kiểm tra COMMENT hoặc MODIFY.
3. Update comment_threads.status = RESOLVED.
4. Set resolvedAt, resolvedBy.
5. Với mỗi annotation trong thread:
   - update annotations.status = RESOLVED
   - set resolvedAt, resolvedBy
6. Update review_sessions.metrics:
   - openAnnotations -= số annotation vừa resolve
   - resolvedAnnotations += số annotation vừa resolve
7. Tạo notification ANNOTATION_RESOLVED.
8. Ghi audit log UPDATE/STATUS_CHANGE.
```

### Rule

```text
THREAD_RESOLVE_01: Resolve thread đồng bộ resolve annotation.
THREAD_RESOLVE_02: Thread đã RESOLVED thì resolve lại không làm thay đổi metrics lần nữa.
```

---

## Reopen Thread

### Luồng

```text
1. User bấm Reopen.
2. Backend kiểm tra COMMENT hoặc MODIFY.
3. Update thread.status = OPEN.
4. Clear hoặc giữ resolvedAt/resolvedBy tùy policy.
5. Update annotations.status = OPEN.
6. Update metrics.
7. Ghi audit log.
```

Rule:

```text
THREAD_REOPEN_01: Reopen thread đồng bộ reopen annotation.
```

---

## Delete Comment Thread

### Gợi ý MVP

Không nên hard delete.

Nếu cần:

```text
- Chỉ Owner được delete thread.
- Hoặc author được delete nếu chưa có replies.
- Delete thread phải xử lý annotation liên quan.
```

Khuyến nghị:

```text
MVP: dùng RESOLVED thay cho DELETE.
```

---

# 9. Module Review Session

## 9.1. Collection liên quan

```text
review_sessions
asset
annotations
comment_threads
audit_logs
notifications
```

`review_sessions` quản lý workflow status, reviewers, statusHistory, metrics, createdBy và completedAt; status gồm `DRAFT`, `IN_REVIEW`, `REQUEST_CHANGES`, `APPROVED`. 

---

## Create Review Session

### Khi nào tạo?

```text
- Producer gửi version đi review.
- Sau khi upload new version và cần review tiếp.
```

### Actor

```text
Producer
Owner
```

### Input

```text
assetId
versionId
title
description
dueDate
reviewers[]
```

### Luồng

```text
1. Producer mở asset/version.
2. Bấm Create Review Session hoặc Send for Review.
3. Backend kiểm tra MODIFY.
4. Backend kiểm tra version thuộc asset.
5. Backend kiểm tra version.status = COMPLETED.
6. Nếu video, kiểm tra processingStatus = READY hoặc cho phép gửi trước nhưng hiển thị processing.
7. Insert review_sessions:
   - assetId
   - versionId
   - title
   - description
   - dueDate
   - status = DRAFT hoặc IN_REVIEW
   - statusHistory có record đầu tiên
   - reviewers
   - metrics = lấy từ annotation/comment hiện tại hoặc 0
   - createdBy
8. Update asset.latestReviewSessionId.
9. Update asset.assetStatus = IN_REVIEW nếu gửi luôn.
10. Tạo notification REVIEW_INVITATION.
11. Ghi audit log CREATE REVIEW_SESSION.
```

### Rule

```text
REVIEW_CREATE_01: Một review session gắn với một versionId.
REVIEW_CREATE_02: User phải có MODIFY để tạo review session.
REVIEW_CREATE_03: Reviewer phải là collaborator hoặc được mời hợp lệ.
REVIEW_CREATE_04: Reviewer/Producer/Owner có quyền approve.
```

---

## Read Review Session

### Các kiểu đọc

```text
- List review sessions của asset
- List review sessions user cần review
- Get review session detail
- Get status history
```

### Query

```text
assetId = assetId
versionId optional
status optional
reviewers.userId = currentUser.userId
```

### Rule

```text
REVIEW_READ_01: User có READ asset được xem review session.
REVIEW_READ_02: Reviewer chỉ thấy session mà họ được mời hoặc asset họ có quyền.
```

---

## Update Review Session Metadata

### Hành động

```text
- Đổi title
- Đổi description
- Đổi dueDate
- Thêm/xóa reviewer
```

### Actor

```text
Owner
Producer
```

### Luồng

```text
1. User sửa review settings.
2. Backend kiểm tra MODIFY hoặc OWNER.
3. Update review_sessions.
4. Nếu thêm reviewer, tạo notification REVIEW_INVITATION.
5. Ghi audit log UPDATE REVIEW_SESSION.
```

### Rule

```text
REVIEW_UPDATE_01: Không sửa versionId của review session sau khi tạo.
REVIEW_UPDATE_02: Không sửa assetId sau khi tạo.
REVIEW_UPDATE_03: Review APPROVED không nên cho sửa metadata, trừ Owner.
```

---

## Update Review Status

### Status transition

```text
DRAFT -> IN_REVIEW
IN_REVIEW -> REQUEST_CHANGES
IN_REVIEW -> APPROVED
REQUEST_CHANGES -> IN_REVIEW
APPROVED -> IN_REVIEW nếu reopen
```

### Luồng Start Review

```text
1. Producer bấm Start Review.
2. Backend kiểm tra MODIFY.
3. Update review_session.status = IN_REVIEW.
4. Push statusHistory.
5. Update asset.assetStatus = IN_REVIEW.
6. Tạo notification cho reviewers.
7. Ghi audit log STATUS_CHANGE.
```

### Luồng Request Changes

```text
1. Reviewer bấm Request Changes.
2. Có thể nhập note.
3. Backend kiểm tra user là reviewer hoặc có COMMENT.
4. Update review_session.status = REQUEST_CHANGES.
5. Push statusHistory.
6. Update asset.assetStatus = REQUEST_CHANGES.
7. Tạo notification cho producer/owner.
8. Ghi audit log STATUS_CHANGE.
```

### Luồng Approve

```text
1. Reviewer/Producer/Owner bấm Approve.
2. Backend kiểm tra user có role Reviewer/Producer/Owner trong project.
3. Update review_session.status = APPROVED.
4. Set completedAt = now.
5. Push statusHistory.
6. Update asset.assetStatus = APPROVED.
7. Tạo notification STATUS_CHANGE.
8. Ghi audit log STATUS_CHANGE.
```

### Rule

```text
REVIEW_STATUS_01: Status change phải ghi statusHistory.
REVIEW_STATUS_02: Status change phải ghi audit log.
REVIEW_STATUS_03: Chỉ Reviewer/Producer/Owner được APPROVED.
REVIEW_STATUS_04: REQUEST_CHANGES nên có note nếu không còn annotation OPEN.
REVIEW_STATUS_05: APPROVED nên yêu cầu không còn OPEN annotation? 
```

Gợi ý MVP cho rule cuối:

```text
Cho phép APPROVED dù còn OPEN annotation, nhưng hiển thị warning.
```

Về lâu dài, có thể chặn approve nếu còn open feedback.

---

## Delete Review Session

### Gợi ý

Không hard delete nếu đã có status history/comment.

Luồng:

```text
1. Owner chọn cancel/delete draft review session.
2. Nếu status = DRAFT và chưa có activity:
   - cho delete hoặc mark cancelled nếu bổ sung status
3. Nếu đã IN_REVIEW:
   - không delete, chỉ close/cancel nếu có status CANCELLED
```

Vì schema chưa có `CANCELLED`, MVP có thể:

```text
- Chỉ cho xóa review_session DRAFT.
- Không cho xóa session đã IN_REVIEW.
```

Rule:

```text
REVIEW_DELETE_01: Chỉ Owner/Producer được xóa DRAFT review session.
REVIEW_DELETE_02: Không xóa session đã có statusHistory quan trọng.
```

---

# 10. Module Share Link

## 10.1. Collection liên quan

```text
asset.shareToken
asset.shareExpiry
metadata.visibility
metadata.publicPermission
audit_logs
```

Trong database, `asset` có `shareToken`, `shareExpiry`; metadata/version có `visibility`, `publicPermission`, `userPermissions`. 

---

## Create Share Link

### Actor

```text
Owner
```

### Input

```text
assetId
permission: READ
expiry optional
```

### Luồng

```text
1. Owner mở Share Settings.
2. Chọn permission.
3. Chọn expiry.
4. Backend kiểm tra OWNER.
5. Generate shareToken.
6. Update asset.shareToken, asset.shareExpiry.
7. Có thể update metadata.visibility/publicPermission nếu dùng ở version.
8. Ghi audit log SHARE.
9. Trả về share URL.
```

### Rule

```text
SHARE_CREATE_01: Chỉ Owner được tạo share link.
SHARE_CREATE_02: MVP được chọn quyền, mặc định là READ.
SHARE_CREATE_03: Không cho MODIFY qua share link.
SHARE_CREATE_04: Token phải random, không đoán được.
```

---

## Read Share Link

### Luồng

```text
1. Guest mở /share/:shareToken.
2. Backend tìm asset theo shareToken.
3. Kiểm tra shareExpiry.
4. Nếu hết hạn -> SHARE_LINK_EXPIRED.
5. Xác định permission public.
6. Trả về asset + latest version + quyền tương ứng.
```

### Rule

```text
SHARE_READ_01: Share link hết hạn thì từ chối.
SHARE_READ_02: Share link chỉ READ + select flow, không comment.
```

---

## Update Share Link

### Hành động

```text
- Đổi expiry
- Regenerate token
```

### Rule

```text
SHARE_UPDATE_01: Chỉ Owner được update.
SHARE_UPDATE_02: Regenerate token làm link cũ mất hiệu lực.
```

---

## Delete/Revoke Share Link

### Luồng

```text
1. Owner bấm Revoke.
2. Backend set shareToken = null, shareExpiry = null.
3. Ghi audit log SHARE.
```

Rule:

```text
SHARE_DELETE_01: Revoke xong link cũ không truy cập được.
```

---

# 11. Module Notification

## 11.1. Collection liên quan

```text
notifications
users.notificationPreferences
```

`notifications` hiện hỗ trợ các loại như `NEW_COMMENT`, `MENTION`, `STATUS_CHANGE`, `NEW_VERSION`, `REVIEW_INVITATION`, `ANNOTATION_RESOLVED`, `DEADLINE_REMINDER`. 

---

## Create Notification

### Event tạo notification

```text
NEW_COMMENT
MENTION
STATUS_CHANGE
NEW_VERSION
REVIEW_INVITATION
ANNOTATION_RESOLVED
```

### Luồng

```text
1. Một nghiệp vụ chính xảy ra.
2. Service xác định recipients.
3. Kiểm tra notificationPreferences.
4. Insert notifications.
5. Nếu có email channel thì set deliveryStatus.email = PENDING.
```

### Rule

```text
NOTI_CREATE_01: Không notify chính người tạo action nếu không cần.
NOTI_CREATE_02: Mention luôn ưu tiên hơn NEW_COMMENT thường.
NOTI_CREATE_03: Notification phải có deep link.
```

---

## Read Notification

```text
GET /notifications
GET /notifications?isRead=false
```

Rule:

```text
NOTI_READ_01: User chỉ đọc notification của chính mình.
```

---

## Update Notification

Hành động:

```text
- Mark one as read
- Mark all as read
```

Rule:

```text
NOTI_UPDATE_01: User chỉ mark read notification của chính mình.
```

---

## Delete Notification

Có thể không cần trong MVP.

Nếu làm:

```text
- User xóa notification khỏi inbox của mình.
- Hoặc TTL tự xóa bằng expiresAt.
```

---

# 12. Module Audit Log

## 12.1. Collection liên quan

```text
audit_logs
```

`audit_logs` có actor, action, target, context, changes, requestInfo, timestamp; action đã bao gồm `CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE`, `PERMISSION_CHANGE`, `SHARE`, `DOWNLOAD`, `UPLOAD_COMPLETE`. 

---

## Create Audit Log

Audit log không do user tạo trực tiếp, mà do system tạo sau các nghiệp vụ quan trọng.

### Các event bắt buộc

```text
CREATE PROJECT
UPDATE PROJECT
DELETE PROJECT
PERMISSION_CHANGE
UPLOAD_COMPLETE
UPLOAD_NEW_VERSION
STATUS_CHANGE
SHARE CREATE/UPDATE/REVOKE
DELETE ASSET
DOWNLOAD
```

### Rule

```text
AUDIT_CREATE_01: Action quan trọng phải ghi actor.
AUDIT_CREATE_02: Nếu system làm thì actorType = SYSTEM.
AUDIT_CREATE_03: Status change phải ghi before/after.
AUDIT_CREATE_04: Permission change phải ghi before/after.
```

---

## Read Audit Log

### Actor

```text
Owner
Admin
```

### Query

```text
assetId
versionId
reviewSessionId
actorId
action
timestamp range
```

### Rule

```text
AUDIT_READ_01: User thường không xem audit log toàn hệ thống.
AUDIT_READ_02: Owner được xem audit log của project/asset mình sở hữu.
```

---

## Update/Delete Audit Log

Không nên có ở nghiệp vụ thường.

Rule:

```text
AUDIT_IMMUTABLE_01: Audit log không được sửa.
AUDIT_IMMUTABLE_02: Chỉ TTL/system cleanup được xóa theo expiresAt.
```

---

# 14. Bảng CRUD tổng hợp theo collection

| Collection                | Create               | Read                       | Update                            | Delete               |
| ------------------------- | -------------------- | -------------------------- | --------------------------------- | -------------------- |
| `users`                   | Đăng ký/OAuth        | `/me`, collaborator lookup | profile, preferences              | disable              |
| `projects`                | create project       | list/detail                | metadata, status, collaborators   | soft delete          |
| `folder`                  | create folder        | tree/list/detail           | rename/move/permission            | soft delete nếu rỗng |
| `asset`                   | upload file lần đầu  | list/detail/share          | name, desc, folder, status, share | soft delete          |
| `metadata/media_versions` | upload version       | version history/detail     | processing info, download name    | soft delete          |
| `media_renditions`        | worker tạo           | playback read              | worker update status              | cleanup              |
| `processing_jobs`         | upload video tạo job | status/progress            | worker update                     | cancel/cleanup       |
| `annotations`             | timecode/region      | list by version            | edit/resolve/reopen               | hạn chế, nên resolve |
| `comment_threads`         | root comment         | list/detail                | reply/edit/resolve                | hạn chế              |
| `review_sessions`         | create review        | list/detail                | metadata/status/reviewers         | chỉ DRAFT            |
| `notifications`           | system event         | list unread/all            | mark read                         | TTL/delete           |
| `audit_logs`              | system create        | owner/admin read           | không sửa                         | TTL/system cleanup   |

---

# 15. Những điểm cần chỉnh nhẹ trong database để bớt vướng khi code

Dựa trên luồng CRUD ở trên, mình đề xuất bạn chỉnh/chuẩn hóa vài điểm trước khi code:

## 15.1. Thống nhất tên collection

Trong file database có lúc ghi:

```text
media_assets
media_versions
```

nhưng chi tiết lại dùng:

```text
asset
metadata
```

Nên chốt một trong hai hướng:

```text
assets
media_versions
```

hoặc:

```text
media_assets
media_versions
```

Không nên để code dùng `asset` còn tài liệu dùng `media_assets`.

---

## 15.2. `comment_threads` nên có `versionId`

Hiện schema comment thread có:

```text
version: Number
```

nhưng index lại có `versionId`. Nên đổi thành:

```javascript
{
  "versionId": ObjectId,
  "versionNumber": Number
}
```

Lý do:

```text
- versionId dùng để query chính xác.
- versionNumber dùng để hiển thị cho user.
```

---

## 15.3. `asset` nên có soft delete fields

Hiện `projects` và `metadata` có soft delete rõ hơn, nhưng `asset` chưa thấy `isActive/isTrash/trashedAt`.

Nên thêm:

```javascript
{
  "isActive": Boolean,
  "isTrash": Boolean,
  "trashedAt": ISODate
}
```

---

## 15.4. Review session nên cân nhắc thêm `CANCELLED`

Hiện review status có:

```text
DRAFT
IN_REVIEW
REQUEST_CHANGES
APPROVED
```

Nếu muốn xóa/hủy review sau khi đã gửi, nên thêm:

```text
CANCELLED
```

Nếu không thêm, rule MVP là:

```text
Chỉ delete được DRAFT review session.
```

---

## 15.5. Permission nên gom về một service

Vì quyền có thể đến từ nhiều nơi:

```text
project owner
project collaborator
folder permission override
metadata userPermissions
share link publicPermission
admin role
```

Bạn nên có một hàm nghiệp vụ trung tâm:

```text
resolvePermission(user, asset/project/folder/shareToken)
```

Trả về:

```text
{
  canRead: boolean,
  canComment: boolean,
  canModify: boolean,
  isOwner: boolean,
  source: "OWNER" | "PROJECT_ROLE" | "FOLDER_OVERRIDE" | "FILE_PERMISSION" | "SHARE_LINK" | "ADMIN"
}
```

Nếu không làm service này sớm, logic permission sẽ bị rải khắp controller.

---

# 16. Thứ tự triển khai CRUD nên làm

Để ít vỡ nghiệp vụ nhất, nên code theo thứ tự:

```text
1. users/auth
2. projects CRUD
3. collaborators/permission resolve
4. folders CRUD đơn giản
5. asset create/read/update/delete
6. media version create/read
7. upload complete + processing_jobs
8. playback/renditions
9. annotations CRUD tối thiểu
10. comment_threads reply/resolve
11. review_sessions workflow
12. share link
13. audit logs
14. notifications
```

Trong đó, 3 thứ cần khóa rất sớm là:

```text
- versionId là trung tâm của feedback
- permission service
- review_session gắn với một version
```