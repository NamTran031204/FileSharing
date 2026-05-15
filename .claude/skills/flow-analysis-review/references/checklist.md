# Post-execution Checklist

- [ ] Luồng có tuân thủ tuyệt đối cấu trúc schema database tại `server/filesharing-filehandler/src/main/java/org/example/filesharing/entities/models/core` không?
- [ ] Logic lưu trữ có tuân thủ quy tắc: "Metadata là một thể hiện (version) của Asset" không?
- [ ] Output đã được xuất ra định dạng file `.md` chuẩn xác chưa?
- [ ] Đã cập nhật các schema mới (nếu user có cung cấp thêm) vào file `schema.md` chưa?
- [ ] Đã đối chiếu rule role project (create/update/archive/share token/collaborator, default visibility/startDate/stats) chưa?
- [ ] (Nếu luồng liên quan Project/Folder/Asset) Đã kiểm tra RBAC: permission matrix theo role (OWNER/PRODUCER/REVIEWER/GUEST/VIEWER) chưa?
- [ ] (Nếu luồng liên quan Folder) Đã kiểm tra Folder Visibility (INHERIT/RESTRICTED/PUBLIC) và cascade rule qua ancestor chưa?
- [ ] (Nếu luồng liên quan Folder RESTRICTED) Đã kiểm tra: chỉ projectMember được add vào folderCollaborators, folderPermissions là subset của projectPermissions chưa?
- [ ] (Nếu luồng liên quan PUBLIC folder) Đã phân biệt effective permission cho member / GUEST / VIEWER chưa?
