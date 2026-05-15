package org.example.filesharing.enums;

/**
 * INHERIT (Mặc định): Folder kế thừa visibility của parent (project hoặc folder cha trực tiếp). Không lưu thêm dữ liệu. Ai thấy được parent thì thấy được folder này.
 * RESTRICTED: Folder chỉ mở cho một subset member được chỉ định từ danh sách project. Cần lưu folderCollaborators kèm danh sách permission cụ thể cho từng người.
 * PUBLIC: Bất kỳ ai có link đều truy cập được folder, kể cả khi project đang PRIVATE. Đây là cơ chế cho phép chia sẻ một folder ra ngoài mà không cần public cả project.
 */
public enum FolderVisibility {
    INHERIT,
    RESTRICTED,
    PUBLIC
}

/**
 *
 * | Visibility Project | Visibility Folder | Ai truy cập được?                      |
 * |--------------------|-------------------|----------------------------------------|
 * | PRIVATE            | INHERIT           | Members của project                    |
 * | PRIVATE            | RESTRICTED        | Chỉ folder collaborators được chỉ định |
 * | PRIVATE            | PUBLIC            | Bất kỳ ai có link                      |
 * | PUBLIC             | INHERIT           | Bất kỳ ai có link vào project          |
 * | PUBLIC             | RESTRICTED        | Chỉ folder collaborators được chỉ định |
 * | PUBLIC             | PUBLIC            | Bất kỳ ai có link                      |
 */