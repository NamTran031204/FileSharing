import {useState} from 'react';
import {Button, Empty, Input, Select, Tag} from 'antd';
import {DeleteOutlined, PlusOutlined, UserOutlined} from '@ant-design/icons';
import {FileAppPermission, ObjectPermission} from '../../../api/enums.ts';
import {getAvailableObjectPermissions} from '../../../utils/permissionUtils.ts';
import i18n from '../../../i18n';

export interface UserPermission {
    email: string;
    permissionList: ObjectPermission[];
}

interface UserFilePermissionListProps {
    users: UserPermission[];

    onPermissionChange: (email: string, newPermissions: ObjectPermission[]) => void;

    onRemoveUser?: (email: string) => void;

    onAddUser?: (email: string, permissions: ObjectPermission[]) => void;

    readOnly?: boolean;

    currentAppPermission?: FileAppPermission;
}

const UserFilePermissionList = ({
                                    users,
                                    onPermissionChange,
                                    onRemoveUser,
                                    onAddUser,
                                    readOnly = false,
                                    currentAppPermission = FileAppPermission.OWNER
                                }: UserFilePermissionListProps) => {

    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPermissions, setNewUserPermissions] = useState<ObjectPermission[]>([ObjectPermission.READ]);
    const [addError, setAddError] = useState<string | null>(null);

    const availablePermissions = getAvailableObjectPermissions(currentAppPermission);

    const canDelete = currentAppPermission === FileAppPermission.OWNER;

    const permissionOptions = [
        {
            label: i18n.t('file:userFilePermissionList.readOnly'),
            value: ObjectPermission.READ,
            description: i18n.t('file:userFilePermissionList.chiDuocXemFile')
        },
        {
            label: i18n.t('file:userFilePermissionList.comment'),
            value: ObjectPermission.COMMENT,
            description: i18n.t('file:userFilePermissionList.duocXemVaComment')
        },
        {
            label: i18n.t('file:userFilePermissionList.modify'),
            value: ObjectPermission.MODIFY,
            description: i18n.t('file:userFilePermissionList.duocXemCommentVaChinh')
        },
    ].filter(option => availablePermissions.includes(option.value));

    const handlePermissionChange = (email: string, newPermissions: ObjectPermission[]) => {
        onPermissionChange(email, newPermissions);
    };

    const handleRemoveUser = (email: string) => {
        onPermissionChange(email, []);
    };

    const handleAddUser = () => {
        setAddError(null);

        const trimmedEmail = newUserEmail.trim();
        if (!trimmedEmail) {
            setAddError(i18n.t('file:userFilePermissionList.vuiLongNhapEmail'));
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            setAddError(i18n.t('file:userFilePermissionList.emailKhongHopLe'));
            return;
        }

        if (users.some(user => user.email.toLowerCase() === trimmedEmail.toLowerCase())) {
            setAddError(i18n.t('file:userFilePermissionList.emailNayDaDuocThem'));
            return;
        }

        if (newUserPermissions.length === 0) {
            setAddError(i18n.t('file:userFilePermissionList.vuiLongChonItNhat'));
            return;
        }

        onAddUser?.(trimmedEmail, newUserPermissions);

        setNewUserEmail('');
        setNewUserPermissions([ObjectPermission.READ]);
        setAddError(null);
    };

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
                    <span>{i18n.t('file:userFilePermissionList.nguoiDung', {length: users.length})}</span>
                    <span>{i18n.t('file:userFilePermissionList.quyenTruyCap')}</span>
                </div>
            </div>

            {!readOnly && onAddUser && (
                <div className="bg-primary/5 p-4 border-b border-border">
                    <div className="flex items-start gap-2">
                        <div className="flex w-3/4">
                            <Input
                                placeholder={i18n.t('file:userFilePermissionList.nhapEmailNguoiDung')}
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
                            placeholder={i18n.t('file:userFilePermissionList.chonQuyen')}
                            maxTagCount={1}
                        />

                        <Button
                            type="primary"
                            icon={<PlusOutlined/>}
                            onClick={handleAddUser}
                        >
                            {i18n.t('file:userFilePermissionList.them')}
                        </Button>
                    </div>
                </div>
            )}

            {users.length === 0 ? (
                <div className="p-6 bg-muted/30">
                    <Empty
                        description={
                            <span className="text-muted-foreground text-sm">
                                {i18n.t('file:userFilePermissionList.chuaCoNguoiDungNao')}
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

                                <div className="flex items-center gap-2">
                                    {!readOnly ? (
                                        <>
                                            <Select
                                                mode="multiple"
                                                style={{minWidth: 200}}
                                                value={user.permissionList}
                                                onChange={(newPermissions) => handlePermissionChange(user.email, newPermissions)}
                                                options={permissionOptions}
                                                placeholder={i18n.t('file:userFilePermissionList.chonQuyen')}
                                                maxTagCount={2}
                                                disabled={readOnly}
                                            />

                                            {onRemoveUser && canDelete && (
                                                <button
                                                    onClick={() => handleRemoveUser(user.email)}
                                                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                                                    title={i18n.t('file:userFilePermissionList.xoaNguoiDung')}
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
