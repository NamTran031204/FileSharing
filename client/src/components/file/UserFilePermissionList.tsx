import {useState} from 'react';
import {Button, Empty, Input, Select, Tag} from 'antd';
import {DeleteOutlined, PlusOutlined, UserOutlined} from '@ant-design/icons';
import {FileAppPermission, ObjectPermission} from '../../api/enums';
import {getAvailableObjectPermissions} from '../../utils/permissionUtils';

/**
 * Interface định nghĩa cấu trúc dữ liệu permission của một user
 */
export interface UserPermission {
    email: string;
    permissionList: ObjectPermission[];
}

/**
 * Props của component UserFilePermissionList
 */
interface UserFilePermissionListProps {
    /** Danh sách users và permissions của họ */
    users: UserPermission[];

    /** Callback khi permission của một user thay đổi */
    onPermissionChange: (email: string, newPermissions: ObjectPermission[]) => void;

    /** Callback khi xóa một user khỏi danh sách */
    onRemoveUser?: (email: string) => void;

    /** Callback khi thêm user mới */
    onAddUser?: (email: string, permissions: ObjectPermission[]) => void;

    /** Chế độ read-only (không cho phép chỉnh sửa) */
    readOnly?: boolean;

    /** Quyền hiện tại của user đối với file này - dùng để kiểm soát logic UI */
    currentAppPermission?: FileAppPermission;
}

/**
 * Component hiển thị danh sách users và permissions của họ trên file
 *
 * Data Flow (One-Way):
 * 1. Parent truyền mảng users xuống qua props
 * 2. Component render list dựa trên props.users
 * 3. Khi user tương tác (thay đổi Select), component gọi callback onPermissionChange
 * 4. Parent nhận callback, update state của nó
 * 5. State mới được truyền lại xuống qua props → component re-render
 *
 * Lưu ý: Component này KHÔNG quản lý state nội bộ cho danh sách users.
 * Nó chỉ render dữ liệu từ props và báo thay đổi lên parent (controlled component).
 */
const UserFilePermissionList = ({
                                    users,
                                    onPermissionChange,
                                    onRemoveUser,
                                    onAddUser,
                                    readOnly = false,
                                    currentAppPermission = FileAppPermission.OWNER
                                }: UserFilePermissionListProps) => {

    // Local state cho Add User form
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPermissions, setNewUserPermissions] = useState<ObjectPermission[]>([ObjectPermission.READ]);
    const [addError, setAddError] = useState<string | null>(null);

    /**
     * Filter permission options dựa trên currentAppPermission
     * User chỉ được grant quyền <= quyền của mình
     */
    const availablePermissions = getAvailableObjectPermissions(currentAppPermission);

    /**
     * Kiểm tra xem có thể xóa user không (chỉ OWNER)
     */
    const canDelete = currentAppPermission === FileAppPermission.OWNER;

    /**
     * Options cho Select component
     * Mapping enum ObjectPermission sang label hiển thị
     * Chỉ hiển thị các quyền được phép grant
     */
    const permissionOptions = [
        {
            label: 'Read Only',
            value: ObjectPermission.READ,
            description: 'Chỉ được xem file'
        },
        {
            label: 'Comment',
            value: ObjectPermission.COMMENT,
            description: 'Được xem và comment'
        },
        {
            label: 'Modify',
            value: ObjectPermission.MODIFY,
            description: 'Được xem, comment và chỉnh sửa'
        },
    ].filter(option => availablePermissions.includes(option.value));

    /**
     * Handler khi user thay đổi permissions trong Select
     * Gọi callback từ parent để báo thay đổi
     */
    const handlePermissionChange = (email: string, newPermissions: ObjectPermission[]) => {
        onPermissionChange(email, newPermissions);
    };

    /**
     * Handler khi user click nút xóa
     * Logic: Gọi onPermissionChange với empty array [] thay vì xóa khỏi mảng
     * Backend sẽ tự động xóa user khỏi DB khi nhận empty permissions
     */
    const handleRemoveUser = (email: string) => {
        onPermissionChange(email, []);
    };

    /**
     * Handler khi user click nút Add
     * Validate email và gọi callback onAddUser
     */
    const handleAddUser = () => {
        // Reset error
        setAddError(null);

        // Validate email không rỗng
        const trimmedEmail = newUserEmail.trim();
        if (!trimmedEmail) {
            setAddError('Vui lòng nhập email');
            return;
        }

        // Validate email format (basic)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            setAddError('Email không hợp lệ');
            return;
        }

        // Kiểm tra email đã tồn tại
        if (users.some(user => user.email.toLowerCase() === trimmedEmail.toLowerCase())) {
            setAddError('Email này đã được thêm');
            return;
        }

        // Validate ít nhất 1 permission
        if (newUserPermissions.length === 0) {
            setAddError('Vui lòng chọn ít nhất một quyền');
            return;
        }

        // Gọi callback
        onAddUser?.(trimmedEmail, newUserPermissions);

        // Reset form
        setNewUserEmail('');
        setNewUserPermissions([ObjectPermission.READ]);
        setAddError(null);
    };

    /**
     * Render permission badges
     */
    const renderPermissionBadges = (permissions: ObjectPermission[]) => {
        const colorMap = {
            [ObjectPermission.READ]: 'blue',
            [ObjectPermission.COMMENT]: 'green',
            [ObjectPermission.MODIFY]: 'orange',
        };

        return permissions.map(permission => (
            <Tag key={permission} color={colorMap[permission]}>
                {permission}
            </Tag>
        ));
    };


    return (
        <div className="border border-border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-muted/50 px-4 py-2 border-b border-border">
                <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
                    <span>Người dùng ({users.length})</span>
                    <span>Quyền truy cập</span>
                </div>
            </div>

            {/* Add User Section - Chỉ hiển thị khi không readOnly */}
            {!readOnly && onAddUser && (
                <div className="bg-primary/5 p-4 border-b border-border">
                    <div className="flex items-start gap-2">
                        <div className="flex w-3/4">
                            <Input
                                placeholder="Nhập email người dùng"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                onPressEnter={handleAddUser}
                                status={addError ? 'error' : ''}
                            />
                            {addError && (
                                <p className="text-xs text-destructive mt-1">{addError}</p>
                            )}
                        </div>

                        <Select
                            mode="multiple"
                            style={{minWidth: 200}}
                            value={newUserPermissions}
                            onChange={setNewUserPermissions}
                            options={permissionOptions}
                            placeholder="Chọn quyền"
                            maxTagCount={1}
                        />

                        <Button
                            type="primary"
                            icon={<PlusOutlined/>}
                            onClick={handleAddUser}
                        >
                            Thêm
                        </Button>
                    </div>
                </div>
            )}

            {/* List Container với scroll hoặc Empty state */}
            {users.length === 0 ? (
                <div className="p-6 bg-muted/30">
                    <Empty
                        description={
                            <span className="text-muted-foreground text-sm">
                                Chưa có người dùng nào được chia sẻ
                            </span>
                        }
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                </div>
            ) : (
                <div className="max-h-60 overflow-y-auto">
                    {users
                        .filter(user => user.permissionList.length > 0) // Chỉ hiển thị users có quyền
                        .map((user, index) => (
                            <div
                                key={user.email}
                                className={`
                                flex justify-between items-center gap-4 p-4
                                hover:bg-muted/30 transition-colors
                                ${index !== users.length - 1 ? 'border-b border-border' : ''}
                            `}
                            >
                                {/* Left: User Info */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div
                                        className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                        <UserOutlined className="text-primary text-sm"/>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate" title={user.email}>
                                            {user.email}
                                        </p>
                                        {readOnly && (
                                            <div className="mt-1 flex gap-1 flex-wrap">
                                                {renderPermissionBadges(user.permissionList)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Permission Select hoặc Delete Button */}
                                <div className="flex items-center gap-2">
                                    {!readOnly ? (
                                        <>
                                            <Select
                                                mode="multiple"
                                                style={{minWidth: 200}}
                                                value={user.permissionList}
                                                onChange={(newPermissions) => handlePermissionChange(user.email, newPermissions)}
                                                options={permissionOptions}
                                                placeholder="Chọn quyền"
                                                maxTagCount={2}
                                                disabled={readOnly}
                                            />

                                            {/* Chỉ OWNER mới được phép xóa user */}
                                            {onRemoveUser && canDelete && (
                                                <button
                                                    onClick={() => handleRemoveUser(user.email)}
                                                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                                                    title="Xóa người dùng"
                                                >
                                                    <DeleteOutlined className="text-destructive"/>
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex gap-1 flex-wrap justify-end">
                                            {renderPermissionBadges(user.permissionList)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

export default UserFilePermissionList;
