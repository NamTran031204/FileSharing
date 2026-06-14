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

| Role   | Ý nghĩa                                                                                     |
|--------|---------------------------------------------------------------------------------------------|
| SA     | Quản trị toàn nền tảng, có thể override mọi project khi cần                                 |
| ADMIN  | Quản trị hệ thống, có vai trò như staff của SA, có thể override trong phạm vi admin khi cần |
| TENANT | Quản trị trong tenant, có thể override trong phạm vi tenant khi cần                         |
| USER   | Người dùng đã đăng nhập thuộc tenant                                                        |

Ở cấp dự án (Project level) có các role:

| Role     | Ý nghĩa                                                                 |
| -------- | ----------------------------------------------------------------------- |
| Owner    | Chủ sở hữu project/asset                                                |
| Producer | Người upload và quản lý nội dung, có thể mời thành viên                |
| Reviewer | Người review và đưa quyết định approve/request changes                 |
| Guest    | Vãng lai có định danh qua share link, chỉ `READ` + select flow          |
| Viewer   | Vãng lai ẩn danh, chỉ `READ`                                            |

---

## 2.2. Permission Matrix đơn giản

| Hành động / Tính năng          | Owner | Producer | Reviewer | Guest | Viewer |
|--------------------------------|:-----:|:--------:|:--------:|:-----:|:------:|
| Cập nhật thông tin project     |   ✅   |    ❌     |    ❌     |   ❌   |   ❌    |
| Xóa project                    |   ✅   |    ❌     |    ❌     |   ❌   |   ❌    |
| Thêm/Xóa thành viên (Invite)   |   ✅   |    ✅     |    ❌     |   ❌   |   ❌    |
| Cấp quyền Owner cho người khác |   ✅   |    ❌     |    ❌     |   ❌   |   ❌    |
| Upload ảnh/video               |   ✅   |    ✅     |    ❌     |   ❌   |   ❌    |
| Xóa/Sắp xếp ảnh/video          |   ✅   |    ✅     |    ❌     |   ❌   |   ❌    |
| Tạo Folder/Version             |   ✅   |    ✅     |    ❌     |   ❌   |   ❌    |
| Xem nội dung (View)            |   ✅   |    ✅     |    ✅     |   ✅   |   ✅    |
| Download (nếu được phép)       |   ✅   |    ✅     |    ✅     |   ❌   |   ❌    |
| Comment & Reply                |   ✅   |    ✅     |    ✅     |   ❌   |   ❌    |
| Thả cảm xúc (Reaction)         |   ✅   |    ✅     |    ✅     |   ❌   |   ❌    |
| Approve/Reject Asset           |   ✅   |    ✅     |    ✅     |   ❌   |   ❌    |
| Chọn nhiều ảnh (Multi-select)  |   ✅   |    ✅     |    ✅     |   ✅   |   ❌    |
| Gửi danh sách ảnh đã chọn      |   ✅   |    ✅     |    ✅     |   ✅   |   ❌    |


## 2.3 Core Workflows
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

## 2.4 MVP
- Upload video/image
- Video streaming
- Timecode comment
- Image annotation
- Threaded comment
- Version history
- Review status
- Permission enforcement
- Share link

## 2.5 Important Rules
- Comment/annotation luôn gắn với `assetId` và `versionNumber`.
- `asset` là đại diện cho một tệp media, `metadata` là đại diện cho các version và thông tin file tướng ứng với `asset` đó
- Upload new version không ghi đè metadata cũ.
- Feedback version cũ không tự động hiện ở version mới.
- Không có quyền COMMENT thì không được tạo feedback.
- Không có MODIFY thì không được upload version.
- Status change phải ghi audit log, các hành động thêm sửa xoá cũng phải ghi audit log.
```

---
