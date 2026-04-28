**Kết luận nhanh:** nhìn từ các entity trong `#file:core`, hệ thống hiện có **khung phân quyền đa nguồn** (ownerId, collaborator role, object permission override, share/public, admin role), nhưng **chưa encode cứng ma trận role → permission** như trong `000-permission-matrix.md`.

### Ma trận phân quyền hiện tại (suy ra từ entity)

| Vai trò/nguồn quyền | READ | COMMENT | MODIFY | OWNER | Căn cứ entity |
|---|---|---|---|---|---|
| `ProjectCollaboratorRole.VIEWER` | Chưa encode cứng | Chưa encode cứng | Chưa encode cứng | Không | `ProjectEntity.collaborators.role` chỉ lưu role, không lưu mapping quyền |
| `ProjectCollaboratorRole.REVIEWER` | Chưa encode cứng | Chưa encode cứng | Chưa encode cứng | Không | Như trên |
| `ProjectCollaboratorRole.PRODUCER` | Chưa encode cứng | Chưa encode cứng | Chưa encode cứng | Không | Như trên |
| Owner (project/asset/version) | Có thể suy ra | Có thể suy ra | Có thể suy ra | Có | `ownerId/ownerEmail` ở `ProjectEntity`, `AssetEntity`, `MetadataEntity` |
| Guest qua share link | Có (nếu token hợp lệ) | Có thể có | **Có thể có theo schema** | Không | `shareToken/shareExpiry` + `MetadataEntity.publicPermission:ObjectPermission` |
| Admin hệ thống | Theo policy service | Theo policy service | Theo policy service | Không mặc định | `UserEntity.roles` có `ROLE_ADMIN` |
| Override theo folder/file | Có | Có | Có | Không | `FolderPermission.permissions`, `UserFilePermission.permissionList` dùng `ObjectPermission` |
| Review approver | (đặc thù review status) | (đặc thù review status) | (đặc thù review status) | (không phải OWNER) | `ReviewSessionEntity.reviewers.role` = `REVIEWER/APPROVER` |

> `ObjectPermission` hiện tại chỉ có: `READ`, `COMMENT`, `MODIFY` (không có `OWNER`).

---

### Nhận định so với `#file:000-permission-matrix.md`

1. **Khớp về cấu trúc vai trò chính**: có Viewer/Reviewer/Producer, Owner (qua `ownerId`), Guest (qua share token), Admin (`ROLE_ADMIN`).
2. **Lệch quan trọng 1 – OWNER không nằm trong permission enum lưu DB**:  
   File ma trận dùng bộ quyền `READ/COMMENT/MODIFY/OWNER`, nhưng entity DB chỉ có `ObjectPermission = READ/COMMENT/MODIFY`; `OWNER` đang là ownership theo `ownerId`, không phải permission cấp phát.
3. **Lệch quan trọng 2 – Share/public permission trong schema cho phép tới MODIFY**:  
   Ma trận mục tiêu nói share link MVP chỉ nên `READ/COMMENT`, nhưng `MetadataEntity.publicPermission` dùng `ObjectPermission` nên về mặt dữ liệu vẫn chứa được `MODIFY`.
4. **Thiếu mapping cứng role → permission trong entity**:  
   Ma trận mục tiêu thể hiện mapping rõ (Viewer=READ, Reviewer=READ+COMMENT, Producer=+MODIFY, Owner=+OWNER), còn entity chỉ lưu role; việc map thực tế đang phụ thuộc service/controller.
5. **Review approval đã có mô hình riêng và tương thích**:  
   `ReviewerRole.APPROVER` trong `ReviewSessionEntity` phù hợp rule “chỉ approver/owner được approve”, nhưng đây là lớp quyền workflow riêng, không nằm trong `ObjectPermission`.

**Tóm lại:** data model hiện tại **đủ thành phần để triển khai** ma trận trong `000-permission-matrix.md`, nhưng vẫn có 2 khoảng cách cần chốt để đồng bộ:  
- chuẩn hóa `OWNER` là permission hay ownership flag,  
- chặn `MODIFY` cho share/public ở tầng validate/service nếu muốn đúng ma trận mục tiêu.