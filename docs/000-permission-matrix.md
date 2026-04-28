Đây là **ma trận phân quyền tổng hợp** từ `0-product-analyst.md` và `00-ptyc.md` (ưu tiên rule chặt hơn khi có khác biệt).

| Vai trò | READ | COMMENT | MODIFY | OWNER | Ghi chú |
|---|---|---|---|---|---|
| Viewer | ✅ | ❌ | ❌ | ❌ | Chỉ xem |
| Reviewer | ✅ | ✅ | ❌ | ❌ | Có thể request changes; chỉ approve nếu được gán **APPROVER** |
| Producer | ✅ | ✅ | ✅ | ❌ | Upload/sửa nội dung, thao tác kỹ thuật |
| Owner | ✅ | ✅ | ✅ | ✅ | Toàn quyền trong project/asset |
| Guest (share link) | ✅/❌ | ✅/❌ | ❌ | ❌ | Phụ thuộc `publicPermission/sharePermission` (MVP: READ hoặc COMMENT) |
| Admin (hệ thống) | Theo phạm vi vận hành | Theo phạm vi vận hành | Theo phạm vi vận hành | Không mặc định là owner nội dung | Xem vận hành, đọc audit/system, một số API quản trị |

| Nghiệp vụ | Viewer | Reviewer | Producer | Owner | Guest (share) | Admin |
|---|---|---|---|---|---|---|
| Xem project/asset/version | ✅ (nếu là member) | ✅ | ✅ | ✅ | ✅ (qua token hợp lệ) | ✅ |
| Comment/annotation/reply | ❌ | ✅ | ✅ | ✅ | ⚠️ chỉ khi link `COMMENT` và có guest identity | ⚠️ không phải luồng chính |
| Resolve/Reopen thread | ❌ | ✅ (COMMENT) | ✅ (MODIFY) | ✅ | ❌ (không khuyến nghị) | ⚠️ |
| Upload media / New version | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Sửa metadata asset/folder | ❌ | ❌ | ✅ | ✅ | ❌ | ⚠️ |
| Đổi review status: Start review | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Đổi review status: Request changes | ❌ | ✅ | ⚠️ nếu có COMMENT trong session | ✅ | ❌ | ❌ |
| Đổi review status: Approve | ❌ | ⚠️ chỉ khi là APPROVER | ❌ | ✅ | ❌ | ❌ |
| Quản lý collaborator (add/update/remove) | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Đổi permission / override quyền | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Tạo/đổi/revoke share link | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Xóa asset/version | ❌ | ❌ | ⚠️ có thể nếu MODIFY; một số case bắt buộc Owner | ✅ | ❌ | ⚠️ |
| Xem audit log | ❌ | ❌ | ❌ | ✅ (scope sở hữu) | ❌ | ✅ |
| Cancel processing job | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (system/admin) |

**Lưu ý cần chốt để tránh lệch implement:**
1. `BR-PERM-04` nói chỉ **OWNER** được đổi permission/share link; trong module folder có chỗ mô tả update permission override theo `MODIFY` → nên thống nhất theo hướng **OWNER**.
2. Share link nên chốt chính thức: **chỉ Owner tạo**, và chỉ cấp `READ`/`COMMENT` (không `MODIFY`).