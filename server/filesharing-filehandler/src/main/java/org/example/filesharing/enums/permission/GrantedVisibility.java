package org.example.filesharing.enums.permission;

/**
 * PUBLIC -> user chưa đăng nhập (GUEST, VIEWER) có thể mở link và thực hiện xem
 * PRIVATE -> bắt buộc user phải đăng nhập (và có trong danh sách) mới có quyền được xét truy cập
 */
public enum GrantedVisibility {
    PUBLIC, PRIVATE;
}
