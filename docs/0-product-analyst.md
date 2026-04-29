<!-- TOC -->
* [1. Product Overview](#1-product-overview)
  * [1.1. Tên dự án](#11-tên-dự-án)
  * [1.2. Mục tiêu sản phẩm](#12-mục-tiêu-sản-phẩm)
  * [1.3. Bài toán cần giải quyết](#13-bài-toán-cần-giải-quyết)
  * [1.4. Giá trị sản phẩm](#14-giá-trị-sản-phẩm)
  * [1.5. MVP Scope](#15-mvp-scope)
  * [1.6. Out of Scope](#16-out-of-scope)
* [2. User Roles](#2-user-roles)
  * [2.1. Nhóm người dùng chính](#21-nhóm-người-dùng-chính)
  * [2.2. Permission chính](#22-permission-chính)
  * [2.3. Permission Matrix đơn giản](#23-permission-matrix-đơn-giản)
* [3. Feature List](#3-feature-list)
  * [3.1. P0 - Must Have](#31-p0---must-have)
    * [F01. Media Upload](#f01-media-upload)
    * [F02. Video Streaming Playback](#f02-video-streaming-playback)
    * [F03. Comment theo timecode video](#f03-comment-theo-timecode-video)
    * [F04. Annotation vùng ảnh](#f04-annotation-vùng-ảnh)
    * [F05. Threaded Comment cơ bản](#f05-threaded-comment-cơ-bản)
    * [F06. Version History](#f06-version-history)
    * [F07. Review Status](#f07-review-status)
    * [F08. Permission Enforcement](#f08-permission-enforcement)
    * [F09. Share Link](#f09-share-link)
  * [3.2. P1 - Should Have](#32-p1---should-have)
  * [3.3. P2 - Could Have](#33-p2---could-have)
* [4. Business Entities](#4-business-entities)
  * [4.1. Entity List](#41-entity-list)
  * [4.2. Quan hệ giữa các entity](#42-quan-hệ-giữa-các-entity)
* [5. Entity States](#5-entity-states)
  * [5.1. Project Status](#51-project-status)
  * [5.2. Asset Status](#52-asset-status)
  * [5.3. Media Version Upload Status](#53-media-version-upload-status)
  * [5.4. Media Processing Status](#54-media-processing-status)
  * [5.5. Annotation / Comment Thread Status](#55-annotation--comment-thread-status)
  * [5.6. Review Session Status](#56-review-session-status)
* [6. State Transitions](#6-state-transitions)
  * [6.1. Review Session](#61-review-session)
  * [6.2. Asset Status](#62-asset-status)
  * [6.3. Annotation / Thread](#63-annotation--thread)
  * [6.4. Processing Job](#64-processing-job)
* [7. Use Cases](#7-use-cases)
  * [UC01. Đăng ký / đăng nhập](#uc01-đăng-ký--đăng-nhập)
    * [Mục tiêu](#mục-tiêu)
    * [Actor](#actor)
    * [Luồng chính](#luồng-chính)
    * [Rule](#rule)
  * [UC02. Tạo project](#uc02-tạo-project)
    * [Mục tiêu](#mục-tiêu-1)
    * [Actor](#actor-1)
    * [Luồng chính](#luồng-chính-1)
    * [Dữ liệu tạo](#dữ-liệu-tạo)
    * [Rule](#rule-1)
  * [UC03. Mời collaborator vào project](#uc03-mời-collaborator-vào-project)
    * [Mục tiêu](#mục-tiêu-2)
    * [Actor](#actor-2)
    * [Luồng chính](#luồng-chính-2)
    * [Rule](#rule-2)
  * [UC04. Upload media lần đầu](#uc04-upload-media-lần-đầu)
    * [Mục tiêu](#mục-tiêu-3)
    * [Actor](#actor-3)
    * [Luồng chính](#luồng-chính-3)
    * [Rule](#rule-3)
  * [UC05. Xem media](#uc05-xem-media)
    * [Mục tiêu](#mục-tiêu-4)
    * [Actor](#actor-4)
    * [Luồng chính](#luồng-chính-4)
    * [Rule](#rule-4)
  * [UC06. Comment theo timecode video](#uc06-comment-theo-timecode-video)
    * [Mục tiêu](#mục-tiêu-5)
    * [Actor](#actor-5)
    * [Luồng chính](#luồng-chính-5)
    * [Rule](#rule-5)
  * [UC07. Annotation vùng ảnh](#uc07-annotation-vùng-ảnh)
    * [Mục tiêu](#mục-tiêu-6)
    * [Actor](#actor-6)
    * [Luồng chính](#luồng-chính-6)
    * [Rule](#rule-6)
  * [UC08. Reply comment](#uc08-reply-comment)
    * [Mục tiêu](#mục-tiêu-7)
    * [Actor](#actor-7)
    * [Luồng chính](#luồng-chính-7)
    * [Rule](#rule-7)
  * [UC09. Resolve comment](#uc09-resolve-comment)
    * [Mục tiêu](#mục-tiêu-8)
    * [Actor](#actor-8)
    * [Luồng chính](#luồng-chính-8)
    * [Rule](#rule-8)
  * [UC10. Upload new version](#uc10-upload-new-version)
    * [Mục tiêu](#mục-tiêu-9)
    * [Actor](#actor-9)
    * [Luồng chính](#luồng-chính-9)
    * [Rule](#rule-9)
  * [UC11. Xem version history](#uc11-xem-version-history)
    * [Mục tiêu](#mục-tiêu-10)
    * [Actor](#actor-10)
    * [Luồng chính](#luồng-chính-10)
    * [Rule](#rule-10)
  * [UC12. Chuyển review status](#uc12-chuyển-review-status)
    * [Mục tiêu](#mục-tiêu-11)
    * [Actor](#actor-11)
    * [Luồng chính](#luồng-chính-11)
    * [Rule](#rule-11)
  * [UC13. Tạo share link](#uc13-tạo-share-link)
    * [Mục tiêu](#mục-tiêu-12)
    * [Actor](#actor-12)
    * [Luồng chính](#luồng-chính-12)
    * [Rule](#rule-12)
* [8. Business Rules](#8-business-rules)
  * [8.1. Rule về quyền](#81-rule-về-quyền)
  * [8.2. Rule về upload](#82-rule-về-upload)
  * [8.3. Rule về version](#83-rule-về-version)
  * [8.4. Rule về annotation](#84-rule-về-annotation)
  * [8.5. Rule về comment](#85-rule-về-comment)
  * [8.6. Rule về review session](#86-rule-về-review-session)
  * [8.7. Rule về audit log](#87-rule-về-audit-log)
  * [8.8. Rule về notification](#88-rule-về-notification)
* [9. Screens](#9-screens)
  * [9.1. Danh sách màn hình MVP](#91-danh-sách-màn-hình-mvp)
  * [9.2. Login/Register](#92-loginregister)
    * [Route gợi ý](#route-gợi-ý)
    * [Dữ liệu hiển thị](#dữ-liệu-hiển-thị)
    * [Hành động](#hành-động)
    * [Lỗi](#lỗi)
  * [9.3. Dashboard](#93-dashboard)
    * [Route](#route)
    * [Mục đích](#mục-đích)
    * [Dữ liệu hiển thị](#dữ-liệu-hiển-thị-1)
    * [Hành động](#hành-động-1)
  * [9.4. Project List](#94-project-list)
    * [Route](#route-1)
    * [Dữ liệu hiển thị](#dữ-liệu-hiển-thị-2)
    * [Hành động](#hành-động-2)
  * [9.5. Project Detail](#95-project-detail)
    * [Route](#route-2)
    * [Dữ liệu hiển thị](#dữ-liệu-hiển-thị-3)
    * [Hành động](#hành-động-3)
  * [9.6. Asset Detail](#96-asset-detail)
    * [Route](#route-3)
    * [Dữ liệu hiển thị](#dữ-liệu-hiển-thị-4)
    * [Hành động](#hành-động-4)
  * [9.7. Video Review Screen](#97-video-review-screen)
    * [Route](#route-4)
    * [Dữ liệu hiển thị](#dữ-liệu-hiển-thị-5)
    * [Hành động](#hành-động-5)
    * [Empty State](#empty-state)
    * [Loading State](#loading-state)
    * [Error State](#error-state)
  * [9.8. Image Review Screen](#98-image-review-screen)
    * [Route](#route-5)
    * [Dữ liệu hiển thị](#dữ-liệu-hiển-thị-6)
    * [Hành động](#hành-động-6)
  * [9.9. Version History Panel](#99-version-history-panel)
    * [Dữ liệu hiển thị](#dữ-liệu-hiển-thị-7)
    * [Hành động](#hành-động-7)
  * [9.10. Share Settings](#910-share-settings)
    * [Dữ liệu hiển thị](#dữ-liệu-hiển-thị-8)
    * [Hành động](#hành-động-8)
* [10. Forms](#10-forms)
  * [10.1. Form tạo Project](#101-form-tạo-project)
  * [10.2. Form Upload Media](#102-form-upload-media)
  * [10.3. Form Upload New Version](#103-form-upload-new-version)
  * [10.4. Form Timecode Comment](#104-form-timecode-comment)
  * [10.5. Form Image Annotation](#105-form-image-annotation)
  * [10.6. Form Review Status Change](#106-form-review-status-change)
* [11. API Draft](#11-api-draft)
  * [11.1. Auth](#111-auth)
  * [11.2. Projects](#112-projects)
  * [11.3. Folders](#113-folders)
  * [11.4. Assets](#114-assets)
  * [11.5. Versions](#115-versions)
  * [11.6. Playback / Renditions](#116-playback--renditions)
  * [11.7. Annotations](#117-annotations)
  * [11.8. Comment Threads](#118-comment-threads)
  * [11.9. Review Sessions](#119-review-sessions)
  * [11.10. Share Link](#1110-share-link)
  * [11.11. Notifications](#1111-notifications)
  * [11.12. Audit Logs](#1112-audit-logs)
* [12. Error Handling](#12-error-handling)
  * [12.1. Error Codes](#121-error-codes)
  * [12.2. Error Response Format](#122-error-response-format)
  * [12.3. Một số lỗi nghiệp vụ chính](#123-một-số-lỗi-nghiệp-vụ-chính)
* [13. Notifications](#13-notifications)
  * [13.1. Sự kiện tạo notification](#131-sự-kiện-tạo-notification)
  * [13.2. MVP Recommendation](#132-mvp-recommendation)
* [14. Audit Log](#14-audit-log)
  * [14.1. Các hành động cần ghi log](#141-các-hành-động-cần-ghi-log)
  * [14.2. Audit log tối thiểu cần lưu](#142-audit-log-tối-thiểu-cần-lưu)
  * [14.3. Rule](#143-rule)
* [15. Search / Filter / Sort](#15-search--filter--sort)
  * [15.1. Project List](#151-project-list)
  * [15.2. Asset List](#152-asset-list)
  * [15.3. Comment / Annotation List](#153-comment--annotation-list)
* [16. Data Ownership](#16-data-ownership)
  * [16.1. Ownership chính](#161-ownership-chính)
  * [16.2. Rule truy cập dữ liệu](#162-rule-truy-cập-dữ-liệu)
* [17. Background Jobs](#17-background-jobs)
  * [17.1. Job cần có](#171-job-cần-có)
  * [17.2. Processing Flow](#172-processing-flow)
  * [17.3. Rule retry](#173-rule-retry)
* [18. Security Rules](#18-security-rules)
  * [18.1. Auth](#181-auth)
  * [18.2. Permission](#182-permission)
  * [18.3. Upload](#183-upload)
  * [18.4. Data Isolation](#184-data-isolation)
* [19. Test Cases](#19-test-cases)
  * [19.1. Upload Media](#191-upload-media)
  * [19.2. Video Comment](#192-video-comment)
  * [19.3. Image Annotation](#193-image-annotation)
  * [19.4. Versioning](#194-versioning)
  * [19.5. Review Status](#195-review-status)
  * [19.6. Share Link](#196-share-link)
* [20. MVP Definition](#20-mvp-definition)
  * [20.1. MVP bắt buộc hoàn thành](#201-mvp-bắt-buộc-hoàn-thành)
  * [20.2. Không bắt buộc trong MVP](#202-không-bắt-buộc-trong-mvp)
* [21. Gợi ý thứ tự code theo nghiệp vụ](#21-gợi-ý-thứ-tự-code-theo-nghiệp-vụ)
* [22. Checklist trước khi bước vào coding](#22-checklist-trước-khi-bước-vào-coding)
* [23. Một số quyết định nghiệp vụ nên chốt sớm](#23-một-số-quyết-định-nghiệp-vụ-nên-chốt-sớm)
  * [23.1. Folder có nằm trong MVP không?](#231-folder-có-nằm-trong-mvp-không)
  * [23.2. Upload new version có tạo review session mới không?](#232-upload-new-version-có-tạo-review-session-mới-không)
  * [23.3. Annotation cũ có copy sang version mới không?](#233-annotation-cũ-có-copy-sang-version-mới-không)
  * [23.4. Share link có cho comment không?](#234-share-link-có-cho-comment-không)
  * [23.5. Ai được approve?](#235-ai-được-approve)
* [24. Bản rút gọn để bạn đưa vào tài liệu](#24-bản-rút-gọn-để-bạn-đưa-vào-tài-liệu)
<!-- TOC -->

# 1. Product Overview

## 1.1. Tên dự án

**Media Review Platform**

## 1.2. Mục tiêu sản phẩm

Xây dựng một nền tảng giúp team sản xuất media và khách hàng review nội dung hiệu quả hơn bằng cách:

* Upload video/image để review.
* Comment trực tiếp tại timecode của video.
* Vẽ annotation trên ảnh.
* Quản lý version của media.
* Theo dõi trạng thái review: `IN_REVIEW`, `REQUEST_CHANGES`, `APPROVED`.
* Phân quyền người dùng theo vai trò/quyền truy cập.

## 1.3. Bài toán cần giải quyết

Hiện tại quá trình review media thường gặp các vấn đề:

* Feedback nằm rải rác qua chat/email.
* Reviewer nói “đoạn này”, “chỗ kia” nhưng không rõ timestamp hoặc vị trí cụ thể.
* Version cũ/mới dễ bị nhầm lẫn.
* Không rõ file nào đã duyệt, file nào cần sửa.
* Upload và xem video dung lượng lớn chưa ổn định.

## 1.4. Giá trị sản phẩm

Sản phẩm giúp:

* Reviewer feedback chính xác hơn.
* Producer sửa đúng vị trí, đúng version.
* PM dễ theo dõi tiến độ review.
* Giảm vòng lặp phản hồi giữa team sản xuất và khách hàng.

## 1.5. MVP Scope

MVP tập trung vào các chức năng P0:

* Upload video/image.
* Streaming playback cho video.
* Comment theo timecode video.
* Annotation vùng ảnh.
* Threaded comment cơ bản.
* Version history.
* Review status cơ bản.
* Permission theo `READ`, `COMMENT`, `MODIFY`, `OWNER`.
* Share link an toàn theo quyền. 

## 1.6. Out of Scope

Các phần chưa làm ở MVP:

* Realtime multi-cursor kiểu Figma.
* Digital Asset Management đầy đủ.
* Live streaming.
* Side-by-side compare nâng cao.
* Webhook/integration với PM tools.
* Dashboard hiệu suất review nâng cao.

---

# 2. User Roles

## 2.1. Nhóm người dùng chính

Hệ thống có 3 persona chính:

| Persona                       | Mục tiêu                                              |
| ----------------------------- | ----------------------------------------------------- |
| Media Producer                | Upload media, nhận feedback rõ ràng, xử lý revision   |
| Reviewer / Client             | Comment chính xác theo timeline/vùng ảnh, duyệt nhanh |
| Project Manager / Coordinator | Theo dõi trạng thái duyệt, version, SLA phản hồi      |

Ngoài ra, về mặt hệ thống (System level) có các role:

| Role  | Ý nghĩa                                                             |
| ----- | ------------------------------------------------------------------- |
| SA    | Quản trị toàn nền tảng, có thể override mọi project khi cần          |
| ADMIN | Quản trị trong tenant, có thể override trong phạm vi tenant khi cần  |
| USER  | Người dùng đã đăng nhập thuộc tenant                                |

Ở cấp dự án (Project level) có các role:

| Role     | Ý nghĩa                                                                 |
| -------- | ----------------------------------------------------------------------- |
| Owner    | Chủ sở hữu project/asset                                                |
| Producer | Người upload và quản lý nội dung, có thể mời thành viên                |
| Reviewer | Người review và đưa quyết định approve/request changes                 |
| Guest    | Vãng lai có định danh qua share link, chỉ `READ` + select flow          |
| Viewer   | Vãng lai ẩn danh, chỉ `READ`                                            |

---

## 2.2. Permission chính

Hệ thống đang dùng nhóm quyền:

```text
READ
COMMENT
MODIFY
OWNER
```

## 2.3. Permission Matrix đơn giản

| Hành động / Tính năng            | Owner | Producer | Reviewer | Guest | Viewer |
| ------------------------------- | :---: | :------: | :------: | :---: | :----: |
| Cập nhật thông tin project      | ✅ | ❌ | ❌ | ❌ | ❌ |
| Xóa project                     | ✅ | ❌ | ❌ | ❌ | ❌ |
| Thêm/Xóa thành viên (Invite)    | ✅ | ✅ | ❌ | ❌ | ❌ |
| Cấp quyền Owner cho người khác  | ✅ | ❌ | ❌ | ❌ | ❌ |
| Upload ảnh/video                | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xóa/Sắp xếp ảnh/video            | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tạo Folder/Version              | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xem nội dung (View)             | ✅ | ✅ | ✅ | ✅ | ✅ |
| Download (nếu được phép)        | ✅ | ✅ | ✅ | ❌ | ❌ |
| Comment & Reply                 | ✅ | ✅ | ✅ | ❌ | ❌ |
| Thả cảm xúc (Reaction)          | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve/Reject Asset            | ✅ | ✅ | ✅ | ❌ | ❌ |
| Chọn nhiều ảnh (Multi-select)   | ✅ | ✅ | ✅ | ✅ | ❌ |
| Gửi danh sách ảnh đã chọn       | ✅ | ✅ | ✅ | ✅ | ❌ |

---

# 3. Feature List

## 3.1. P0 - Must Have

Đây là nhóm chức năng bắt buộc để sản phẩm dùng được.

### F01. Media Upload

Người dùng có quyền `MODIFY` hoặc `OWNER` có thể upload video/image vào project hoặc folder.

Yêu cầu nghiệp vụ:

* Hỗ trợ video và image.
* File upload tạo ra một `asset`.
* File upload lần đầu tạo `versionNumber = 1`.
* Upload version mới tăng `versionNumber`.
* Upload lỗi thì version có trạng thái `FAILED`.
* Upload thành công thì version có trạng thái `COMPLETED`.

---

### F02. Video Streaming Playback

Reviewer có thể xem video trực tiếp trên trình duyệt.

Yêu cầu nghiệp vụ:

* Video cần có trạng thái xử lý sẵn sàng trước khi review mượt.
* Nếu video chưa xử lý xong, hiển thị trạng thái processing.
* Nếu xử lý lỗi, hiển thị thông báo lỗi.
* Playback dùng rendition/HLS nếu có.

---

### F03. Comment theo timecode video

Reviewer có quyền `COMMENT` có thể tạo comment tại một thời điểm cụ thể của video.

Yêu cầu nghiệp vụ:

* Comment phải gắn với `versionId`.
* Comment video phải có `timeCode.startMs`.
* Có thể hỗ trợ `timeCode.endMs`, nhưng MVP có thể cho bằng `startMs`.
* Khi click comment, video nhảy đến đúng timecode.

---

### F04. Annotation vùng ảnh

Reviewer có quyền `COMMENT` có thể vẽ vùng trên ảnh và để lại comment.

Yêu cầu nghiệp vụ:

* Annotation phải gắn với `assetId` và `versionId`.
* Vùng ảnh dùng tọa độ normalized `0-1` để render đúng ở nhiều kích thước màn hình.
* MVP nên hỗ trợ trước `RECTANGLE`.
* Các shape như `CIRCLE`, `POLYGON`, `FREEFORM` có thể để sau.

---

### F05. Threaded Comment cơ bản

Mỗi annotation hoặc comment có thể có thread trao đổi.

Yêu cầu nghiệp vụ:

* Một thread có `rootComment`.
* Người dùng có thể reply vào thread.
* Thread có trạng thái `OPEN` hoặc `RESOLVED`.
* Khi thread resolved, annotation liên quan cũng nên resolved.

---

### F06. Version History

Producer có thể upload version mới và xem lại các version cũ.

Yêu cầu nghiệp vụ:

* Mỗi asset có nhiều version.
* Mỗi version có file metadata riêng.
* Annotation/comment luôn gắn với version cụ thể.
* Khi xem version cũ, chỉ hiển thị feedback của version đó.
* Khi upload version mới, feedback cũ không tự động chuyển sang version mới.

Database của bạn đã xác định nguyên tắc **version-centric**, tức annotation/comment gắn với `versionId` để tránh nhầm feedback giữa các phiên bản. Đây là quyết định nghiệp vụ rất quan trọng. 

---

### F07. Review Status

Mỗi phiên review có trạng thái duyệt.

Trạng thái chính:

```text
DRAFT
IN_REVIEW
REQUEST_CHANGES
APPROVED
```

Yêu cầu nghiệp vụ:

* Producer tạo review session.
* Khi bắt đầu review, trạng thái là `IN_REVIEW`.
* Reviewer/Producer/Owner có thể chuyển sang `REQUEST_CHANGES` hoặc `APPROVED`.
* Khi chuyển trạng thái phải ghi vào `statusHistory`.
* Khi `APPROVED`, phiên review có `completedAt`.

---

### F08. Permission Enforcement

Mọi hành động quan trọng phải kiểm tra quyền.

Yêu cầu nghiệp vụ:

* Không có `READ` thì không được xem.
* Không có `COMMENT` thì không được comment/annotation.
* Không có `MODIFY` thì không được upload version mới.
* Không có `OWNER` thì không được quản lý quyền.
* Share link phải có permission giới hạn.

---

### F09. Share Link

Chỉ Owner và Producer có thể tạo share link cho asset/project.

Yêu cầu nghiệp vụ:

* Share link có thể hết hạn bằng `shareExpiry`.
* Share link gắn với asset thay vì từng version.
* Người truy cập share link nếu chưa đăng nhập thì chỉ có quyền `READ` và thao tác select flow (không `COMMENT`/`MODIFY`).
* Không cho phép modify qua share link.

---

## 3.2. P1 - Should Have

Các chức năng nên làm sau khi P0 ổn định:

* Compare version cơ bản.
* Notification in-app khi có feedback mới.
* Mention user trong comment.
* Search/filter comment theo trạng thái, người tạo.
* Audit trail cho status change và version upload.

---

## 3.3. P2 - Could Have

Các chức năng nâng cao:

* Side-by-side compare đồng bộ timeline.
* Webhook tích hợp PM tools.
* Folder upload nâng cao.
* Dashboard hiệu suất review theo project/team.

---

# 4. Business Entities

## 4.1. Entity List

Dựa trên database hiện tại, hệ thống có các entity nghiệp vụ chính:

| Entity                   | Ý nghĩa                                         |
| ------------------------ | ----------------------------------------------- |
| User                     | Người dùng hệ thống                             |
| Project                  | Không gian làm việc chứa folder và asset        |
| Folder                   | Thư mục tổ chức asset trong project             |
| Asset                    | Media item chính, ví dụ một video/banner/design |
| Media Version / Metadata | Một version cụ thể của asset                    |
| Media Rendition          | Bản xử lý phụ như HLS, thumbnail, poster        |
| Annotation               | Đánh dấu vị trí trên video/image                |
| Comment Thread           | Luồng trao đổi gắn với annotation hoặc asset    |
| Review Session           | Phiên review có workflow status                 |
| Processing Job           | Job xử lý media: transcode, thumbnail           |
| Audit Log                | Lịch sử thao tác quan trọng                     |
| Notification             | Thông báo cho người dùng                        |

---

## 4.2. Quan hệ giữa các entity

```text
User
 ├── owns Projects
 ├── collaborates in Projects
 ├── creates Assets
 ├── creates Comments
 └── receives Notifications

Project
 ├── has many Folders
 ├── has many Assets
 └── has many Collaborators

Folder
 ├── belongs to Project
 ├── may have parent Folder
 └── contains Assets

Asset
 ├── belongs to Project
 ├── may belong to Folder
 ├── has many Versions
 ├── has many Review Sessions
 └── has Share Link

Media Version
 ├── belongs to Asset
 ├── has many Renditions
 ├── has many Annotations
 ├── has many Comment Threads
 └── has Processing Jobs

Annotation
 ├── belongs to Asset
 ├── belongs to Version
 └── links to Comment Thread

Review Session
 ├── belongs to Asset
 ├── reviews one Version
 ├── has Reviewers
 └── has Status History
```

---

# 5. Entity States

## 5.1. Project Status

```text
ACTIVE
ARCHIVED
COMPLETED
```

Ý nghĩa:

| Status    | Ý nghĩa                               |
| --------- | ------------------------------------- |
| ACTIVE    | Project đang hoạt động                |
| ARCHIVED  | Project đã lưu trữ, hạn chế chỉnh sửa |
| COMPLETED | Project đã hoàn tất                   |

---

## 5.2. Asset Status

```text
DRAFT
IN_REVIEW
REQUEST_CHANGES
APPROVED
```

Ý nghĩa:

| Status          | Ý nghĩa                        |
| --------------- | ------------------------------ |
| DRAFT           | Asset mới tạo, chưa gửi review |
| IN_REVIEW       | Đang trong quá trình review    |
| REQUEST_CHANGES | Reviewer yêu cầu chỉnh sửa     |
| APPROVED        | Asset đã được duyệt            |

---

## 5.3. Media Version Upload Status

```text
UPLOADING
COMPLETED
FAILED
```

Ý nghĩa:

| Status    | Ý nghĩa           |
| --------- | ----------------- |
| UPLOADING | File đang upload  |
| COMPLETED | Upload thành công |
| FAILED    | Upload thất bại   |

---

## 5.4. Media Processing Status

```text
PENDING
PROCESSING
READY
FAILED
```

Ý nghĩa:

| Status     | Ý nghĩa            |
| ---------- | ------------------ |
| PENDING    | Chờ xử lý          |
| PROCESSING | Đang xử lý         |
| READY      | Đã sẵn sàng để xem |
| FAILED     | Xử lý thất bại     |

---

## 5.5. Annotation / Comment Thread Status

```text
OPEN
RESOLVED
```

Ý nghĩa:

| Status   | Ý nghĩa                          |
| -------- | -------------------------------- |
| OPEN     | Feedback chưa xử lý xong         |
| RESOLVED | Feedback đã được xử lý hoặc đóng |

---

## 5.6. Review Session Status

```text
DRAFT
IN_REVIEW
REQUEST_CHANGES
APPROVED
```

Ý nghĩa:

| Status          | Ý nghĩa                                     |
| --------------- | ------------------------------------------- |
| DRAFT           | Phiên review mới tạo, chưa gửi cho reviewer |
| IN_REVIEW       | Đang chờ reviewer phản hồi                  |
| REQUEST_CHANGES | Reviewer yêu cầu chỉnh sửa                  |
| APPROVED        | Phiên review đã được duyệt                  |

---

# 6. State Transitions

## 6.1. Review Session

| Trạng thái hiện tại | Hành động          | Trạng thái tiếp theo | Ai được làm               |
| ------------------- | ------------------ | -------------------- | ------------------------- |
| DRAFT               | Start review       | IN_REVIEW            | Producer, Owner           |
| IN_REVIEW           | Request changes    | REQUEST_CHANGES      | Reviewer, Producer, Owner |
| IN_REVIEW           | Approve            | APPROVED             | Reviewer, Producer, Owner |
| REQUEST_CHANGES     | Upload new version | DRAFT hoặc IN_REVIEW | Producer, Owner           |
| REQUEST_CHANGES     | Re-submit review   | IN_REVIEW            | Producer, Owner           |
| APPROVED            | Reopen review      | IN_REVIEW            | Owner                     |

Gợi ý đơn giản cho MVP:

* Khi upload version mới sau `REQUEST_CHANGES`, tạo review session mới.
* Không nên tái sử dụng session cũ cho version mới, để tránh lẫn feedback.

---

## 6.2. Asset Status

| Trạng thái hiện tại | Hành động            | Trạng thái tiếp theo |
| ------------------- | -------------------- | -------------------- |
| DRAFT               | Gửi review           | IN_REVIEW            |
| IN_REVIEW           | Reviewer/Producer yêu cầu sửa | REQUEST_CHANGES      |
| IN_REVIEW           | Reviewer/Producer duyệt       | APPROVED             |
| REQUEST_CHANGES     | Upload version mới   | DRAFT hoặc IN_REVIEW |
| APPROVED            | Upload version mới   | DRAFT                |

---

## 6.3. Annotation / Thread

| Trạng thái hiện tại | Hành động        | Trạng thái tiếp theo |
| ------------------- | ---------------- | -------------------- |
| OPEN                | Resolve feedback | RESOLVED             |
| RESOLVED            | Reopen feedback  | OPEN                 |

Rule đơn giản:

* Resolve thread thì annotation liên quan cũng `RESOLVED`.
* Reopen thread thì annotation liên quan cũng `OPEN`.

---

## 6.4. Processing Job

| Trạng thái hiện tại  | Hành động        | Trạng thái tiếp theo |
| -------------------- | ---------------- | -------------------- |
| PENDING              | Worker nhận job  | PROCESSING           |
| PROCESSING           | Xử lý thành công | COMPLETED            |
| PROCESSING           | Xử lý lỗi        | FAILED               |
| FAILED               | Retry            | PENDING              |
| PENDING / PROCESSING | Hủy job          | CANCELLED            |

---

# 7. Use Cases

## UC01. Đăng ký / đăng nhập

### Mục tiêu

Người dùng có tài khoản để upload, review và quản lý media.

### Actor

* Guest
* User

### Luồng chính

1. Guest mở trang đăng nhập/đăng ký.
2. Nhập email, password hoặc đăng nhập OAuth.
3. Hệ thống xác thực.
4. Nếu thành công, chuyển vào dashboard.
5. Hệ thống cập nhật `lastLoginAt`.

### Rule

* Email không được trùng.
* User bị disabled không được đăng nhập.
* Password không trả về client.

---

## UC02. Tạo project

### Mục tiêu

Owner tạo không gian làm việc để chứa media asset.

### Actor

* User

### Luồng chính

1. User bấm “Create Project”.
2. Nhập project name, project code, mô tả.
3. Hệ thống kiểm tra project code không trùng.
4. Tạo project với `status = ACTIVE`.
5. User tạo project trở thành owner.

### Dữ liệu tạo

* `projectName`
* `projectCode`
* `description`
* `ownerId`
* `status = ACTIVE`

### Rule

* `projectCode` phải unique.
* Chỉ user đã đăng nhập mới tạo project.

---

## UC03. Mời collaborator vào project

### Mục tiêu

Owner/Producer thêm Producer/Reviewer/Viewer vào project.

### Actor

* Owner
* Producer

### Luồng chính

1. Owner/Producer mở project settings.
2. Nhập email collaborator.
3. Chọn role: `PRODUCER`, `REVIEWER`, `VIEWER`.
4. Hệ thống thêm vào `collaborators`.
5. Hệ thống tạo notification nếu user tồn tại.

### Rule

* Chỉ Owner/Producer được thêm/xóa collaborator.
* Không thêm trùng cùng email vào project.
* Role project sẽ map sang permission thực tế.

---

## UC04. Upload media lần đầu

### Mục tiêu

Producer upload video/image để bắt đầu review.

### Actor

* Producer
* Owner

### Luồng chính

1. User chọn project/folder.
2. Bấm upload media.
3. Chọn file video/image.
4. Hệ thống tạo `asset`.
5. Hệ thống tạo version đầu tiên.
6. File được upload lên object storage.
7. Nếu là video, hệ thống tạo processing job.
8. Sau khi upload xong, version chuyển `COMPLETED`.
9. Nếu processing xong, video có thể playback.

### Rule

* User phải có `MODIFY` hoặc `OWNER`.
* File phải thuộc media type được hỗ trợ.
* Asset lần đầu có `versionCount = 1`.
* Version đầu tiên có `versionNumber = 1`.

---

## UC05. Xem media

### Mục tiêu

Reviewer mở media để xem và review.

### Actor

* Viewer
* Reviewer
* Producer
* Owner

### Luồng chính

1. User mở asset detail.
2. Hệ thống kiểm tra quyền `READ`.
3. Hệ thống lấy latest version.
4. Nếu là video, load player.
5. Nếu là image, load image viewer.
6. Hệ thống load annotations/comments của version hiện tại.

### Rule

* Không có `READ` thì trả lỗi `PERMISSION_DENIED`.
* Version đang `FAILED` thì không thể review.
* Video chưa `READY` thì hiển thị processing state.

---

## UC06. Comment theo timecode video

### Mục tiêu

Reviewer tạo feedback tại một mốc thời gian cụ thể.

### Actor

* Reviewer
* Producer
* Owner

### Luồng chính

1. User mở video review.
2. Tạm dừng tại thời điểm cần feedback.
3. Nhập comment.
4. Hệ thống tạo annotation type `TIMECODE`.
5. Hệ thống tạo comment thread gắn với annotation.
6. Comment xuất hiện trên timeline.

### Rule

* User phải có `COMMENT`.
* `timeCode.startMs` không được nhỏ hơn 0.
* `timeCode.startMs` không được vượt quá duration video.
* Comment phải gắn với `versionId`.

---

## UC07. Annotation vùng ảnh

### Mục tiêu

Reviewer đánh dấu vùng cụ thể trên ảnh và để lại feedback.

### Actor

* Reviewer
* Producer
* Owner

### Luồng chính

1. User mở image review.
2. Chọn công cụ rectangle.
3. Kéo vùng cần đánh dấu.
4. Nhập nội dung comment.
5. Hệ thống lưu annotation type `REGION`.
6. Hệ thống tạo thread comment.
7. Sau reload, vùng annotation hiển thị lại đúng vị trí.

### Rule

* User phải có `COMMENT`.
* Tọa độ vùng ảnh lưu normalized từ 0 đến 1.
* MVP chỉ cần hỗ trợ `RECTANGLE`.
* Comment không được rỗng.

---

## UC08. Reply comment

### Mục tiêu

Người dùng trao đổi trong một thread feedback.

### Actor

* Reviewer
* Producer
* Owner

### Luồng chính

1. User mở thread comment.
2. Nhập reply.
3. Hệ thống thêm reply vào `comment_threads.replies`.
4. Cập nhật `replyCount`, `participants`, `lastActivityAt`.

### Rule

* User phải có `COMMENT`.
* Thread đã resolved vẫn có thể cho reply hoặc không, cần chọn rule.
  Gợi ý MVP: **thread resolved vẫn xem được nhưng muốn reply thì phải reopen**.

---

## UC09. Resolve comment

### Mục tiêu

Producer hoặc Reviewer đánh dấu feedback đã xử lý.

### Actor

* Reviewer
* Producer
* Owner

### Luồng chính

1. User mở thread.
2. Bấm Resolve.
3. Hệ thống chuyển thread sang `RESOLVED`.
4. Nếu thread gắn annotation, annotation cũng chuyển `RESOLVED`.
5. Hệ thống ghi `resolvedAt`, `resolvedBy`.

### Rule

* User phải có `COMMENT` hoặc `MODIFY`.
* Không xóa comment khi resolve.
* Resolve là đóng feedback, không phải xóa feedback.

---

## UC10. Upload new version

### Mục tiêu

Producer upload bản chỉnh sửa mới sau khi nhận feedback.

### Actor

* Producer
* Owner

### Luồng chính

1. Producer mở asset.
2. Bấm “Upload new version”.
3. Chọn file mới.
4. Hệ thống tạo version mới với `versionNumber = currentVersionCount + 1`.
5. Hệ thống giữ nguyên version cũ và feedback cũ.
6. Latest version chuyển sang bản mới.
7. Asset status có thể chuyển về `DRAFT` hoặc `IN_REVIEW`.

### Rule

* User phải có `MODIFY`.
* Version cũ không bị ghi đè.
* Comment/annotation cũ vẫn gắn với version cũ.
* New version không tự inherit annotation cũ trong MVP.

---

## UC11. Xem version history

### Mục tiêu

User xem lại các bản cũ và feedback tương ứng.

### Actor

* Người có `READ`

### Luồng chính

1. User mở asset detail.
2. Mở tab version history.
3. Hệ thống hiển thị danh sách version.
4. User chọn một version.
5. Hệ thống load media, annotation, comment của version đó.

### Rule

* Chọn version nào thì chỉ hiện feedback của version đó.
* Version cũ vẫn xem được nếu user có quyền `READ`.

---

## UC12. Chuyển review status

### Mục tiêu

Reviewer/Producer/Owner cập nhật trạng thái review.

### Actor

* Reviewer
* Producer
* Owner

### Luồng chính

1. User mở review session.
2. Chọn `Request changes` hoặc `Approve`.
3. Có thể nhập note.
4. Hệ thống cập nhật `status`.
5. Hệ thống thêm record vào `statusHistory`.
6. Hệ thống ghi audit log.
7. Hệ thống gửi notification cho producer.

### Rule

* Reviewer/Producer/Owner được chuyển sang `APPROVED`.
* Reviewer/Producer có thể `REQUEST_CHANGES`.
* Khi `APPROVED`, set `completedAt`.

---

## UC13. Tạo share link

### Mục tiêu

Owner chia sẻ asset cho khách hàng ngoài hệ thống.

### Actor

* Owner

### Luồng chính

1. Owner mở asset settings.
2. Bật share link.
3. Share link mặc định `READ` (không `COMMENT`).
4. Chọn ngày hết hạn nếu cần.
5. Hệ thống tạo `shareToken`.
6. Người nhận link truy cập với quyền `READ` + select flow.

### Rule

* Share link không có `COMMENT`/`MODIFY` trong MVP.
* Share link hết hạn thì không truy cập được.
* Có thể revoke share link.

---

# 8. Business Rules

## 8.1. Rule về quyền

```text
BR-PERM-01: User phải có READ để xem project/asset/version.
BR-PERM-02: User phải có COMMENT để tạo annotation/comment/reply.
BR-PERM-03: User phải có MODIFY để upload new version.
BR-PERM-04: User phải có OWNER để chỉnh permission/share link.
BR-PERM-05: ADMIN có thể override trong tenant để vận hành; SA có override toàn nền tảng, nhưng không mặc định can thiệp nội dung nếu không cần.
BR-PERM-06: Share link chỉ cấp quyền `READ` + select flow, không `COMMENT`/`MODIFY`.
```

---

## 8.2. Rule về upload

```text
BR-UPLOAD-01: File upload lần đầu tạo asset mới và versionNumber = 1.
BR-UPLOAD-02: Upload new version không ghi đè version cũ.
BR-UPLOAD-03: Upload thất bại tạo trạng thái FAILED hoặc không publish version đó.
BR-UPLOAD-04: Video upload thành công phải tạo processing job.
BR-UPLOAD-05: Video chưa READY thì chưa được coi là sẵn sàng review đầy đủ.
```

---

## 8.3. Rule về version

```text
BR-VERSION-01: Mọi annotation/comment phải gắn với versionId.
BR-VERSION-02: Feedback của version cũ không tự động hiển thị ở version mới.
BR-VERSION-03: Version history phải truy cập được nếu user có READ.
BR-VERSION-04: latest version là version có versionNumber lớn nhất và upload thành công.
```

---

## 8.4. Rule về annotation

```text
BR-ANNOTATION-01: Annotation video phải có timeCode.
BR-ANNOTATION-02: Annotation image phải có region.
BR-ANNOTATION-03: Region coordinate phải nằm trong khoảng 0 đến 1.
BR-ANNOTATION-04: Annotation mới mặc định status = OPEN.
BR-ANNOTATION-05: Resolve annotation không xóa annotation.
```

---

## 8.5. Rule về comment

```text
BR-COMMENT-01: Comment content không được rỗng.
BR-COMMENT-02: Root comment tạo ra comment thread.
BR-COMMENT-03: Reply phải thuộc một thread tồn tại.
BR-COMMENT-04: Thread mới mặc định status = OPEN.
BR-COMMENT-05: Thread resolved không được sửa root comment nếu không có quyền.
```

---

## 8.6. Rule về review session

```text
BR-REVIEW-01: Một review session review một version cụ thể.
BR-REVIEW-02: Chuyển trạng thái phải ghi statusHistory.
BR-REVIEW-03: APPROVED là trạng thái hoàn tất review.
BR-REVIEW-04: REQUEST_CHANGES nghĩa là cần producer tạo bản sửa hoặc xử lý feedback.
BR-REVIEW-05: Upload new version sau REQUEST_CHANGES nên tạo review session mới.
```

---

## 8.7. Rule về audit log

```text
BR-AUDIT-01: Upload complete phải ghi audit log.
BR-AUDIT-02: Status change phải ghi audit log.
BR-AUDIT-03: Permission change phải ghi audit log.
BR-AUDIT-04: Share link create/revoke phải ghi audit log.
BR-AUDIT-05: Audit log cần có actor, target, action, timestamp.
```

---

## 8.8. Rule về notification

```text
BR-NOTI-01: Có feedback mới thì notify producer/owner.
BR-NOTI-02: Có mention thì notify người được mention.
BR-NOTI-03: Status change thì notify các bên liên quan.
BR-NOTI-04: Upload new version thì notify reviewer trong active review.
```

Trong MVP, notification có thể để P1. Nhưng database đã có collection `notifications`, nên có thể thiết kế sẵn nhưng triển khai sau.

---

# 9. Screens

## 9.1. Danh sách màn hình MVP

```text
1. Login/Register
2. Dashboard
3. Project List
4. Project Detail
5. Folder/Asset Browser
6. Asset Detail
7. Video Review Screen
8. Image Review Screen
9. Version History Panel
10. Comment Panel
11. Review Session Panel
12. Share Settings
13. Project Settings / Collaborators
```

---

## 9.2. Login/Register

### Route gợi ý

```text
/login
/register
```

### Dữ liệu hiển thị

* Email
* Password
* OAuth Google nếu có

### Hành động

* Đăng nhập
* Đăng ký
* Quên mật khẩu, nếu làm sau

### Lỗi

* Email/password sai.
* Tài khoản bị khóa.
* Email đã tồn tại.

---

## 9.3. Dashboard

### Route

```text
/dashboard
```

### Mục đích

Hiển thị tổng quan project và review cần xử lý.

### Dữ liệu hiển thị

* Project gần đây.
* Review session đang chờ.
* Notification mới, nếu có.
* Asset mới upload.

### Hành động

* Tạo project.
* Mở project.
* Mở review session.

---

## 9.4. Project List

### Route

```text
/projects
```

### Dữ liệu hiển thị

* Tên project.
* Project code.
* Trạng thái.
* Số asset.
* Số pending review.
* Updated time.

### Hành động

* Tạo project.
* Search project.
* Filter theo status.
* Mở project.

---

## 9.5. Project Detail

### Route

```text
/projects/:projectId
```

### Dữ liệu hiển thị

* Project info.
* Folder list.
* Asset list.
* Collaborators.
* Pending reviews.

### Hành động

* Tạo folder.
* Upload media.
* Mở asset.
* Quản lý collaborator nếu là Owner/Producer.

---

## 9.6. Asset Detail

### Route

```text
/assets/:assetId
```

### Dữ liệu hiển thị

* Asset name.
* Latest version.
* Review status.
* Version count.
* Comment summary.
* Review session hiện tại.

### Hành động

* Review media.
* Upload new version.
* Mở version history.
* Share.
* Đổi status nếu có quyền.

---

## 9.7. Video Review Screen

### Route

```text
/assets/:assetId/versions/:versionId/review
```

### Dữ liệu hiển thị

* Video player.
* Timeline.
* Timecode comments.
* Comment panel.
* Current review status.
* Version selector.

### Hành động

* Play/pause video.
* Tạo comment tại current time.
* Click comment để jump tới timecode.
* Reply/resolve thread.
* Đổi review status.

### Empty State

* Chưa có comment: “Chưa có feedback cho version này.”

### Loading State

* Video đang xử lý: “Video đang được xử lý, vui lòng quay lại sau.”

### Error State

* Processing failed.
* Không có quyền xem.
* Version không tồn tại.

---

## 9.8. Image Review Screen

### Route

```text
/assets/:assetId/versions/:versionId/review
```

### Dữ liệu hiển thị

* Image viewer.
* Annotation overlay.
* Comment panel.
* Version selector.

### Hành động

* Vẽ rectangle annotation.
* Nhập comment.
* Click annotation để mở thread.
* Reply/resolve thread.

---

## 9.9. Version History Panel

### Dữ liệu hiển thị

* Version number.
* Upload time.
* Uploaded by.
* Processing status.
* Review status nếu có.
* File name.

### Hành động

* Chọn version để xem.
* Download version.
* Compare cơ bản nếu P1.

---

## 9.10. Share Settings

### Dữ liệu hiển thị

* Share link hiện tại.
* Quyền `READ` + select flow (cố định).
* Expiry time.
* Trạng thái enabled/disabled.

### Hành động

* Generate link.
* Copy link.
* Revoke link.
* Đổi expiry.

---

# 10. Forms

## 10.1. Form tạo Project

| Field       | Required | Rule                                  |
| ----------- | -------: | ------------------------------------- |
| projectName |       Có | 3-100 ký tự                           |
| projectCode |       Có | Unique, uppercase/kebab-case tùy chọn |
| description |    Không | Tối đa 1000 ký tự                     |
| startDate   |    Không | Date                                  |
| endDate     |    Không | >= startDate                          |

---

## 10.2. Form Upload Media

| Field       | Required | Rule                    |
| ----------- | -------: | ----------------------- |
| file        |       Có | Video/image             |
| assetName   |    Không | Mặc định bằng file name |
| folderId    |    Không | Thuộc project hiện tại  |
| description |    Không | Tối đa 1000 ký tự       |

Validation:

```text
- File không được rỗng.
- File type phải được hỗ trợ.
- User phải có MODIFY.
```

---

## 10.3. Form Upload New Version

| Field | Required | Rule                                    |
| ----- | -------: | --------------------------------------- |
| file  |       Có | Cùng nhóm media type với asset hiện tại |
| note  |    Không | Ghi chú thay đổi                        |

Validation gợi ý:

```text
- Không upload image làm version mới cho asset video.
- Không upload video làm version mới cho asset image.
- User phải có MODIFY.
```

---

## 10.4. Form Timecode Comment

| Field            | Required | Rule                  |
| ---------------- | -------: | --------------------- |
| timeCode.startMs |       Có | >= 0 và <= durationMs |
| content          |       Có | 1-2000 ký tự          |
| mentions         |    Không | User trong project    |

---

## 10.5. Form Image Annotation

| Field       | Required | Rule           |
| ----------- | -------: | -------------- |
| shape       |       Có | MVP: RECTANGLE |
| points      |       Có | Tọa độ 0-1     |
| content     |       Có | 1-2000 ký tự   |
| strokeColor |    Không | Default        |
| fillColor   |    Không | Default        |

---

## 10.6. Form Review Status Change

| Field  | Required | Rule                                       |
| ------ | -------: | ------------------------------------------ |
| status |       Có | `IN_REVIEW`, `REQUEST_CHANGES`, `APPROVED` |
| note   |    Không | Tối đa 1000 ký tự                          |

Validation:

```text
- APPROVED chỉ cho Reviewer/Producer/Owner.
- REQUEST_CHANGES cần có note? 
```

Gợi ý MVP: `note` không bắt buộc, nhưng nên khuyến khích nhập khi request changes.

---

# 11. API Draft

Đây là danh sách API nghiệp vụ mức đơn giản, chưa phải OpenAPI chi tiết.

## 11.1. Auth

```text
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /me
```

---

## 11.2. Projects

```text
GET    /projects
POST   /projects
GET    /projects/:projectId
PATCH  /projects/:projectId
DELETE /projects/:projectId
```

Collaborators:

```text
GET    /projects/:projectId/collaborators
POST   /projects/:projectId/collaborators
PATCH  /projects/:projectId/collaborators/:userId
DELETE /projects/:projectId/collaborators/:userId
```

---

## 11.3. Folders

```text
GET    /projects/:projectId/folders
POST   /projects/:projectId/folders
PATCH  /folders/:folderId
DELETE /folders/:folderId
```

---

## 11.4. Assets

```text
GET    /projects/:projectId/assets
POST   /projects/:projectId/assets
GET    /assets/:assetId
PATCH  /assets/:assetId
DELETE /assets/:assetId
```

Upload:

```text
POST   /assets/upload/init
PUT    /assets/upload/:uploadId/chunk
POST   /assets/upload/:uploadId/complete
POST   /assets/:assetId/versions
```

---

## 11.5. Versions

```text
GET /assets/:assetId/versions
GET /assets/:assetId/versions/:versionId
GET /assets/:assetId/versions/:versionId/download
```

---

## 11.6. Playback / Renditions

```text
GET /versions/:versionId/playback
GET /versions/:versionId/renditions
```

---

## 11.7. Annotations

```text
GET    /versions/:versionId/annotations
POST   /versions/:versionId/annotations
PATCH  /annotations/:annotationId
DELETE /annotations/:annotationId
POST   /annotations/:annotationId/resolve
POST   /annotations/:annotationId/reopen
```

---

## 11.8. Comment Threads

```text
GET   /versions/:versionId/comment-threads
POST  /versions/:versionId/comment-threads
GET   /comment-threads/:threadId
POST  /comment-threads/:threadId/replies
POST  /comment-threads/:threadId/resolve
POST  /comment-threads/:threadId/reopen
```

---

## 11.9. Review Sessions

```text
GET   /assets/:assetId/review-sessions
POST  /assets/:assetId/review-sessions
GET   /review-sessions/:reviewSessionId
PATCH /review-sessions/:reviewSessionId/status
POST  /review-sessions/:reviewSessionId/reviewers
```

---

## 11.10. Share Link

```text
POST   /assets/:assetId/share-link
PATCH  /assets/:assetId/share-link
DELETE /assets/:assetId/share-link
GET    /share/:shareToken
```

---

## 11.11. Notifications

```text
GET   /notifications
POST  /notifications/:notificationId/read
POST  /notifications/read-all
```

Có thể để P1.

---

## 11.12. Audit Logs

```text
GET /assets/:assetId/audit-logs
GET /review-sessions/:reviewSessionId/audit-logs
```

Có thể chỉ dành cho Owner/Admin.

---

# 12. Error Handling

## 12.1. Error Codes

```text
AUTH_REQUIRED
PERMISSION_DENIED
VALIDATION_ERROR
RESOURCE_NOT_FOUND
DUPLICATE_RESOURCE
INVALID_STATE
UPLOAD_FAILED
PROCESSING_NOT_READY
PROCESSING_FAILED
SHARE_LINK_EXPIRED
UNSUPPORTED_MEDIA_TYPE
VERSION_NOT_READY
SERVER_ERROR
```

---

## 12.2. Error Response Format

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
  "details": [
    {
      "field": "content",
      "message": "Nội dung comment không được để trống"
    }
  ]
}
```

---

## 12.3. Một số lỗi nghiệp vụ chính

| Tình huống                   | Error code               |
| ---------------------------- | ------------------------ |
| User chưa đăng nhập          | `AUTH_REQUIRED`          |
| Không có quyền xem asset     | `PERMISSION_DENIED`      |
| Không có quyền comment       | `PERMISSION_DENIED`      |
| Version không tồn tại        | `RESOURCE_NOT_FOUND`     |
| Video chưa xử lý xong        | `PROCESSING_NOT_READY`   |
| Video xử lý lỗi              | `PROCESSING_FAILED`      |
| Share link hết hạn           | `SHARE_LINK_EXPIRED`     |
| File không phải video/image  | `UNSUPPORTED_MEDIA_TYPE` |
| Timecode vượt duration video | `VALIDATION_ERROR`       |
| Chuyển status không hợp lệ   | `INVALID_STATE`          |

---

# 13. Notifications

## 13.1. Sự kiện tạo notification

| Event               | Người nhận                    | Nội dung                    |
| ------------------- | ----------------------------- | --------------------------- |
| New comment         | Owner, Producer, participants | Có feedback mới             |
| Mention             | Người được mention            | Bạn được nhắc trong comment |
| Status change       | Producer, Reviewer            | Review status đã thay đổi   |
| New version         | Reviewer                      | Có version mới cần review   |
| Review invitation   | Reviewer                      | Bạn được mời review         |
| Annotation resolved | Người tạo annotation          | Feedback đã được resolve    |

## 13.2. MVP Recommendation

Trong MVP, bạn có thể chưa cần làm notification đầy đủ.

Nên làm theo thứ tự:

```text
1. In-app notification đơn giản
2. Mention notification
3. Email notification
4. Webhook
```

---

# 14. Audit Log

## 14.1. Các hành động cần ghi log

```text
LOGIN
LOGOUT
UPLOAD_COMPLETE
STATUS_CHANGE
PERMISSION_CHANGE
SHARE
DOWNLOAD
CREATE COMMENT
RESOLVE COMMENT
UPLOAD NEW VERSION
```

## 14.2. Audit log tối thiểu cần lưu

```text
actorId
actorEmail
action
targetType
targetId
assetId
versionId
reviewSessionId
changes.before
changes.after
timestamp
```

## 14.3. Rule

* Status change bắt buộc ghi log.
* Permission change bắt buộc ghi log.
* Upload new version bắt buộc ghi log.
* Share link create/revoke bắt buộc ghi log.

---

# 15. Search / Filter / Sort

## 15.1. Project List

Search:

```text
projectName
projectCode
```

Filter:

```text
status
owner
```

Sort:

```text
updatedAt desc
createdAt desc
projectName asc
```

---

## 15.2. Asset List

Search:

```text
assetName
description
```

Filter:

```text
assetStatus
mediaType
folderId
ownerId
```

Sort:

```text
updatedAt desc
createdAt desc
assetName asc
```

---

## 15.3. Comment / Annotation List

Search:

```text
comment content
createdBy
```

Filter:

```text
status: OPEN / RESOLVED
createdBy
annotationType
versionId
```

Sort:

```text
createdAt asc
lastActivityAt desc
timeCode.startMs asc
```

Với video review, mặc định nên sort comment theo `timeCode.startMs asc`.

---

# 16. Data Ownership

## 16.1. Ownership chính

```text
Project thuộc về ownerId.
Asset thuộc về ownerId và projectId.
Version thuộc về assetId.
Annotation thuộc về versionId và createdBy.
Comment thuộc về thread và createdBy.
Review session thuộc về assetId/versionId và createdBy.
```

## 16.2. Rule truy cập dữ liệu

```text
DO-01: User chỉ thấy project mà mình là owner hoặc collaborator.
DO-02: User chỉ thấy asset thuộc project mình có quyền.
DO-03: User chỉ thấy version nếu có READ trên asset/project.
DO-04: User chỉ comment nếu có COMMENT.
DO-05: User chỉ upload version nếu có MODIFY.
DO-06: User chỉ đổi permission nếu là OWNER.
```

---

# 17. Background Jobs

## 17.1. Job cần có

| Job                 | Mục đích                        |
| ------------------- | ------------------------------- |
| TRANSCODE_HLS       | Chuyển video sang HLS           |
| GENERATE_THUMBNAILS | Tạo thumbnail                   |
| GENERATE_SPRITE     | Tạo sprite preview timeline     |
| GENERATE_POSTER     | Tạo poster image                |
| GENERATE_WAVEFORM   | Tạo waveform nếu cần            |
| VIRUS_SCAN          | Quét file upload nếu triển khai |

## 17.2. Processing Flow

```text
1. User upload video.
2. Upload complete.
3. Hệ thống tạo processing job.
4. Worker nhận job.
5. Worker tạo rendition.
6. Nếu thành công, rendition READY.
7. Version processingStatus = READY.
8. Reviewer có thể playback mượt.
```

## 17.3. Rule retry

```text
- Job lỗi có thể retry tối đa 3 lần.
- Quá số lần retry thì status = FAILED.
- FAILED phải lưu errorMessage.
```

---

# 18. Security Rules

## 18.1. Auth

```text
SEC-01: API nghiệp vụ yêu cầu access token.
SEC-02: Password phải hash.
SEC-03: User disabled không được đăng nhập.
```

## 18.2. Permission

```text
SEC-04: Backend phải check permission, không chỉ check ở frontend.
SEC-05: Share token phải random, khó đoán.
SEC-06: Share token hết hạn phải bị từ chối.
```

## 18.3. Upload

```text
SEC-07: Chỉ cho phép mime type hợp lệ.
SEC-08: Giới hạn file size theo cấu hình.
SEC-09: Không tin mime type từ client hoàn toàn.
SEC-10: File private không được public trực tiếp nếu chưa có permission.
```

## 18.4. Data Isolation

```text
SEC-11: User không được truy cập asset của project không tham gia.
SEC-12: User không được đọc annotation/comment của version không có quyền.
```

---

# 19. Test Cases

## 19.1. Upload Media

```text
TC-UPLOAD-01: Upload image hợp lệ -> tạo asset + version thành công.
TC-UPLOAD-02: Upload video hợp lệ -> tạo asset + version + processing job.
TC-UPLOAD-03: Upload file type không hỗ trợ -> báo UNSUPPORTED_MEDIA_TYPE.
TC-UPLOAD-04: User không có MODIFY upload file -> PERMISSION_DENIED.
TC-UPLOAD-05: Upload lỗi giữa chừng -> version FAILED hoặc upload session failed.
```

---

## 19.2. Video Comment

```text
TC-COMMENT-01: Reviewer tạo comment tại timecode hợp lệ -> thành công.
TC-COMMENT-02: User chỉ có READ tạo comment -> PERMISSION_DENIED.
TC-COMMENT-03: Timecode vượt duration -> VALIDATION_ERROR.
TC-COMMENT-04: Comment rỗng -> VALIDATION_ERROR.
TC-COMMENT-05: Click comment -> video seek đúng timecode.
```

---

## 19.3. Image Annotation

```text
TC-ANNOTATION-01: Tạo rectangle annotation hợp lệ -> thành công.
TC-ANNOTATION-02: Reload trang -> annotation render đúng vị trí.
TC-ANNOTATION-03: Points ngoài khoảng 0-1 -> VALIDATION_ERROR.
TC-ANNOTATION-04: User không có COMMENT -> PERMISSION_DENIED.
```

---

## 19.4. Versioning

```text
TC-VERSION-01: Upload new version -> versionNumber tăng 1.
TC-VERSION-02: Version cũ vẫn xem được.
TC-VERSION-03: Comment version cũ không hiện ở version mới.
TC-VERSION-04: Chọn version cũ -> load đúng media và feedback.
TC-VERSION-05: User không có MODIFY upload new version -> PERMISSION_DENIED.
```

---

## 19.5. Review Status

```text
TC-REVIEW-01: Producer start review -> DRAFT sang IN_REVIEW.
TC-REVIEW-02: Reviewer request changes -> IN_REVIEW sang REQUEST_CHANGES.
TC-REVIEW-03: Reviewer/Producer approve -> IN_REVIEW sang APPROVED.
TC-REVIEW-04: Viewer/Guest approve -> PERMISSION_DENIED.
TC-REVIEW-05: Status change tạo statusHistory và audit log.
```

---

## 19.6. Share Link

```text
TC-SHARE-01: Owner tạo share link READ -> guest xem được asset.
TC-SHARE-02: Guest qua share link chỉ READ + select flow, comment -> PERMISSION_DENIED.
TC-SHARE-03: Share link hết hạn -> SHARE_LINK_EXPIRED.
TC-SHARE-04: Revoke share link -> link cũ không truy cập được.
TC-SHARE-05: Share link không được upload new version.
```

---

# 20. MVP Definition

## 20.1. MVP bắt buộc hoàn thành

MVP được coi là hoàn thành khi:

```text
1. User tạo project được.
2. User upload video/image vào project được.
3. Video xem được bằng streaming sau khi xử lý.
4. Image xem được trong image viewer.
5. Reviewer tạo comment theo timecode video được.
6. Reviewer tạo annotation vùng ảnh được.
7. Thread comment reply/resolve được.
8. Producer upload new version được.
9. User xem được version history.
10. Review status chuyển được: IN_REVIEW, REQUEST_CHANGES, APPROVED.
11. Permission READ/COMMENT/MODIFY/OWNER được enforce ở backend.
12. Share link hoạt động theo quyền.
```

## 20.2. Không bắt buộc trong MVP

```text
1. Notification đầy đủ.
2. Mention user.
3. Side-by-side compare nâng cao.
4. Webhook.
5. Dashboard analytics.
6. Folder upload nâng cao.
7. Realtime collaboration.
```

---

# 21. Gợi ý thứ tự code theo nghiệp vụ

Để tránh vừa code vừa đổi nghiệp vụ quá nhiều, bạn nên làm theo thứ tự này:

```text
1. Auth + User
2. Project + Collaborator
3. Asset + Upload lần đầu
4. Version model
5. Processing job cho video
6. Playback video / image viewer
7. Annotation model
8. Comment thread
9. Version history
10. Review session + status workflow
11. Permission enforcement hoàn chỉnh
12. Share link
13. Audit log
14. Notification nếu còn thời gian
```

Lý do: phần **version-centric** nên được làm sớm, vì annotation/comment/review đều phụ thuộc vào `versionId`. Nếu làm comment trước khi khóa thiết kế version, bạn sẽ rất dễ phải sửa lại database/API sau này.

---

# 22. Checklist trước khi bước vào coding

```text
[ ] Đã thống nhất role: Owner, Producer, Reviewer, Viewer
[ ] Đã thống nhất permission: READ, COMMENT, MODIFY, OWNER
[ ] Đã quyết định project có folder hay MVP bỏ folder
[ ] Đã quyết định upload video/image support định dạng nào
[ ] Đã quyết định version mới có copy feedback cũ hay không
[ ] Đã quyết định review session mới có tạo sau mỗi version hay không
[ ] Đã quyết định ai được APPROVED (Reviewer/Producer/Owner)
[ ] Đã quyết định share link chỉ READ + select flow (không comment)
[ ] Đã quyết định thread resolved có cho reply không
[ ] Đã chuẩn hóa error code
[ ] Đã chuẩn hóa state transition
[ ] Đã xác định API chính
[ ] Đã xác định test case P0
```

---

# 23. Một số quyết định nghiệp vụ nên chốt sớm

Đây là những điểm nếu không chốt trước sẽ dễ làm bạn lăn tăn khi code:

## 23.1. Folder có nằm trong MVP không?

Database đã có `folder`, nhưng core MVP không bắt buộc folder nâng cao.

Gợi ý:

```text
MVP: Có folder cơ bản hoặc cho tất cả asset nằm ở root.
Sau MVP: Làm folder tree nâng cao.
```

## 23.2. Upload new version có tạo review session mới không?

Gợi ý:

```text
Có. Mỗi review session nên gắn với một version cụ thể.
```

Lý do: feedback và trạng thái duyệt sẽ rõ ràng hơn.

## 23.3. Annotation cũ có copy sang version mới không?

Gợi ý MVP:

```text
Không copy.
```

Lý do: tránh phức tạp. Version mới nên là một vòng review mới.

## 23.4. Share link có cho comment không?

Gợi ý:

```text
MVP chỉ hỗ trợ READ + select flow.
Không hỗ trợ COMMENT/MODIFY qua share link.
```

## 23.5. Ai được approve?

Gợi ý:

```text
Owner/Producer/Reviewer đều có thể approve trong review session.
```

---

# 24. Bản rút gọn để bạn đưa vào tài liệu

```markdown
# Business Design - Media Review Platform

## Product Goal
Nền tảng review video/image giúp creative agency và freelancer studio nhận feedback chính xác theo timecode/vùng ảnh, quản lý version và trạng thái duyệt.

## Users
- SA
- Admin
- Owner
- Producer
- Reviewer
- Guest
- Viewer

## Permissions
- READ: xem project/asset/version
- COMMENT: tạo comment/annotation/reply/resolve
- MODIFY: upload media/new version, chỉnh asset
- OWNER: quản lý quyền, share link, xóa asset/project

## Core Entities
- User
- Project
- Folder
- Asset
- Media Version
- Media Rendition
- Annotation
- Comment Thread
- Review Session
- Processing Job
- Audit Log
- Notification

## Core Workflows
1. Tạo project
2. Mời collaborator
3. Upload media
4. Xử lý video
5. Review video/image
6. Comment/annotation
7. Resolve feedback
8. Upload new version
9. Xem version history
10. Approve/request changes
11. Share link

## MVP
- Upload video/image
- Video streaming
- Timecode comment
- Image annotation
- Threaded comment
- Version history
- Review status
- Permission enforcement
- Share link

## Important Rules
- Comment/annotation luôn gắn với versionId.
- Upload new version không ghi đè version cũ.
- Feedback version cũ không tự động hiện ở version mới.
- Không có COMMENT thì không được tạo feedback.
- Không có MODIFY thì không được upload version.
- Status change phải ghi audit log.
```

---
