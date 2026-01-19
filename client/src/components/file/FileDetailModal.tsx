import {forwardRef, useImperativeHandle, useState} from 'react';
import {Button, Divider, Form, Input, message, Modal, Select} from 'antd';
import {CloseOutlined, DeleteOutlined, EditOutlined, EyeOutlined, SaveOutlined} from '@ant-design/icons';
import userFileApiResource, {type MetadataEntity} from '../../api/fileApi/userFileApiResource';
import fileApiResource from '../../api/fileApi/fileApiResource';
import {FileViewUtil} from '../../utils/FileViewUtil';
import {FileAppPermission, ObjectPermission, ObjectVisibility} from "../../api/enums.ts";
import UserFilePermissionList, {type UserPermission} from './UserFilePermissionList';
import {hasPermission} from '../../utils/permissionUtils';

type Mode = 'view' | 'edit';

export interface FileDetailModalRef {
    open: (file: MetadataEntity) => void;
}

interface FileDetailModalProps {
    onFileUpdated?: () => void;
    onFileDeleted?: () => void;
}

const FileDetailModal = forwardRef<FileDetailModalRef, FileDetailModalProps>(
    ({onFileUpdated, onFileDeleted}, ref) => {
        const [form] = Form.useForm();
        const [isOpen, setIsOpen] = useState(false);
        const [mode, setMode] = useState<Mode>('view');
        const [currentFile, setCurrentFile] = useState<MetadataEntity | null>(null);
        const [loading, setLoading] = useState(false);
        const [deleteLoading, setDeleteLoading] = useState(false);
        const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);

        const [originalPermissions, setOriginalPermissions] = useState<UserPermission[]>([]);

        const isEditMode = mode === 'edit';

        useImperativeHandle(ref, () => ({
            open: (file: MetadataEntity) => {
                setCurrentFile(file);
                setMode('view');
                setIsOpen(true);

                // Set form values
                form.setFieldsValue({
                    fileName: file.fileName,
                    mimeType: file.mimeType,
                    fileSize: FileViewUtil.formatBytes(file.fileSize),
                    compressionAlgo: file.compressionAlgo || 'None',
                    ownerId: file.ownerId,
                    timeToLive: file.timeToLive,
                    publicPermission: file.publicPermission,
                    visibility: file.visibility,
                });

                // Initialize user permissions và lưu bản gốc
                const permissions = file.userFilePermissions || [];
                setUserPermissions(permissions);
                setOriginalPermissions(permissions);
            }
        }));

        const handleClose = () => {
            setIsOpen(false);
            setMode('view');
            form.resetFields();
            setCurrentFile(null);
            setUserPermissions([]);
            setOriginalPermissions([]);
        };

        const handleModeSwitch = () => {
            if (mode === 'view') {
                setMode('edit');
            } else {
                handleUpdate();
            }
        };

        const handleCancel = () => {
            if (!currentFile) return;

            form.setFieldsValue({
                fileName: currentFile.fileName,
                mimeType: currentFile.mimeType,
                fileSize: FileViewUtil.formatBytes(currentFile.fileSize),
                compressionAlgo: currentFile.compressionAlgo || 'None',
                ownerId: currentFile.ownerId,
                timeToLive: currentFile.timeToLive,
                publicPermission: currentFile.publicPermission,
                visibility: currentFile.visibility,
            });

            setUserPermissions([...originalPermissions]);

            setMode('view');
        };

        const handleUpdate = async () => {
            if (!currentFile) return;

            try {
                const values = await form.validateFields();
                setLoading(true);

                const updateData = {
                    fileName: values.fileName,
                    timeToLive: values.timeToLive,
                    publicPermission: values.publicPermission,
                    visibility: values.visibility,
                    userFilePermissions: userPermissions,
                };

                // Gọi API và nhận response
                const updatedFile = await userFileApiResource.updateFileDetail(currentFile.fileId, updateData);

                setCurrentFile(updatedFile);
                setUserPermissions(updatedFile.userFilePermissions || []);
                setOriginalPermissions(updatedFile.userFilePermissions || []);

                form.setFieldsValue({
                    fileName: updatedFile.fileName,
                    mimeType: updatedFile.mimeType,
                    fileSize: FileViewUtil.formatBytes(updatedFile.fileSize),
                    compressionAlgo: updatedFile.compressionAlgo || 'None',
                    ownerId: updatedFile.ownerId,
                    timeToLive: updatedFile.timeToLive,
                    publicPermission: updatedFile.publicPermission,
                    visibility: updatedFile.visibility,
                });

                message.success('Cập nhật file thành công!');
                setMode('view');
                onFileUpdated?.();
            } catch (error) {
                console.error('Update error:', error);
                message.error('Có lỗi xảy ra khi cập nhật file');
            } finally {
                setLoading(false);
            }
        };

        const handleDelete = () => {
            if (!currentFile) return;

            Modal.confirm({
                title: 'Xác nhận xóa file',
                content: 'Bạn có chắc chắn muốn chuyển file vào thùng rác?',
                okText: 'Xóa',
                okType: 'danger',
                cancelText: 'Hủy',
                onOk: async () => {
                    try {
                        setDeleteLoading(true);
                        await fileApiResource.moveToTrash(currentFile.fileId);
                        message.success('Đã chuyển file vào thùng rác');
                        handleClose();
                        onFileDeleted?.();
                    } catch (error) {
                        console.error('Delete error:', error);
                        message.error('Có lỗi xảy ra khi xóa file');
                    } finally {
                        setDeleteLoading(false);
                    }
                },
            });
        };

        const permissionOptions = [
            {label: 'Read Only', value: ObjectPermission.READ},
            {label: 'Comment', value: ObjectPermission.COMMENT},
            {label: 'Modify', value: ObjectPermission.MODIFY},
        ];

        const visibilityOptions = [
            {label: 'Private', value: ObjectVisibility.PRIVATE},
            {label: 'Public', value: ObjectVisibility.PUBLIC},
        ];

        const handlePermissionChange = (email: string, newPermissions: ObjectPermission[]) => {
            setUserPermissions(prevPermissions =>
                prevPermissions.map(user =>
                    user.email === email
                        ? {...user, permissionList: newPermissions}
                        : user
                )
            );
        };

        const handleRemoveUser = (email: string) => {
            setUserPermissions(prevPermissions =>
                prevPermissions.map(user =>
                    user.email === email
                        ? {...user, permissionList: []}
                        : user
                )
            );
        };

        const handleAddUser = (email: string, permissions: ObjectPermission[]) => {
            const newUser: UserPermission = {
                email,
                permissionList: permissions
            };

            setUserPermissions(prevPermissions => [...prevPermissions, newUser]);
            message.success(`Đã thêm ${email}`);
        };

        const fileAppPermission = currentFile?.publishUserPermission || FileAppPermission.PUBLIC;

        console.log("current file", currentFile);
        return (
            <Modal
                title={
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-semibold">
                            {isEditMode ? 'Chỉnh sửa File' : 'Chi tiết File'}
                        </span>
                        {!isEditMode && <EyeOutlined className="text-primary"/>}
                        {isEditMode && <EditOutlined className="text-primary"/>}
                    </div>
                }
                open={isOpen}
                onCancel={handleClose}
                width={700}
                footer={null}
                destroyOnHidden
            >
                <div className="max-h-[60vh] overflow-y-auto">
                    <Form
                        form={form}
                        layout="vertical"
                        className="mt-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* File Name - Editable */}
                            <Form.Item
                                label={<span className="font-medium">Tên file</span>}
                                name="fileName"
                                rules={[{required: true, message: 'Vui lòng nhập tên file'}]}
                                className="mb-4"
                            >
                                <Input
                                    disabled={!isEditMode}
                                    placeholder="Nhập tên file"
                                    className={!isEditMode ? 'bg-muted' : ''}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span className="font-medium">Loại file</span>}
                                name="mimeType"
                                className="mb-4"
                            >
                                <Input disabled className="bg-muted"/>
                            </Form.Item>

                            <Form.Item
                                label={<span className="font-medium">Kích thước</span>}
                                name="fileSize"
                                className="mb-4"
                            >
                                <Input disabled className="bg-muted"/>
                            </Form.Item>

                            <Form.Item
                                label={<span className="font-medium">Thuật toán nén</span>}
                                name="compressionAlgo"
                                className="mb-4"
                            >
                                <Input disabled className="bg-muted"/>
                            </Form.Item>

                            {hasPermission(fileAppPermission, FileAppPermission.READ) && (
                                <Form.Item
                                    label={<span className="font-medium">Owner ID</span>}
                                    name="ownerId"
                                    className="mb-4"
                                >
                                    <Input disabled className="bg-muted"/>
                                </Form.Item>
                            )}

                            <Form.Item
                                label={<span className="font-medium">Thời gian lưu trữ (giây)</span>}
                                name="timeToLive"
                                rules={[{required: true, message: 'Vui lòng nhập thời gian'}]}
                                className="mb-4"
                            >
                                <Input
                                    type="number"
                                    disabled={!isEditMode}
                                    placeholder="Nhập thời gian (giây)"
                                    className={!isEditMode ? 'bg-muted' : ''}
                                />
                            </Form.Item>

                            {hasPermission(fileAppPermission, FileAppPermission.READ) && (
                                <Form.Item
                                    label={<span className="font-medium">Quyền công khai</span>}
                                    name="publicPermission"
                                    rules={[{required: true, message: 'Vui lòng chọn quyền'}]}
                                    className="mb-4"
                                >
                                    <Select
                                        disabled={!isEditMode}
                                        options={permissionOptions}
                                        placeholder="Chọn quyền"
                                        className={!isEditMode ? 'bg-muted' : ''}
                                    />
                                </Form.Item>
                            )}

                            {hasPermission(fileAppPermission, FileAppPermission.READ) && (
                                <Form.Item
                                    label={<span className="font-medium">Chế độ hiển thị</span>}
                                    name="visibility"
                                    rules={[{required: true, message: 'Vui lòng chọn chế độ'}]}
                                    className="mb-4"
                                >
                                    <Select
                                        disabled={!isEditMode}
                                        options={visibilityOptions}
                                        placeholder="Chọn chế độ hiển thị"
                                        className={!isEditMode ? 'bg-muted' : ''}
                                    />
                                </Form.Item>
                            )}
                        </div>

                        {hasPermission(fileAppPermission, FileAppPermission.MODIFY) && (
                            <Form.Item
                                label={<span className="font-medium">Quyền chia sẻ với người dùng</span>}
                                className="mb-4"
                            >
                                <UserFilePermissionList
                                    users={userPermissions}
                                    onPermissionChange={handlePermissionChange}
                                    onRemoveUser={handleRemoveUser}
                                    onAddUser={handleAddUser}
                                    readOnly={!isEditMode}
                                    currentAppPermission={fileAppPermission}
                                />
                            </Form.Item>
                        )}
                    </Form>
                </div>

                <Divider className="my-4"/>

                <div className="flex items-center justify-between gap-3 pt-2">
                    {fileAppPermission === FileAppPermission.OWNER && (
                        <Button
                            danger
                            type="primary"
                            icon={<DeleteOutlined/>}
                            onClick={handleDelete}
                            loading={deleteLoading}
                            size="large"
                            className="min-w-[120px]"
                        >
                            Xóa file
                        </Button>
                    )}

                    {hasPermission(fileAppPermission, FileAppPermission.MODIFY) && (
                        <div className="flex items-center gap-2 ml-auto">
                            {isEditMode && (
                                <Button
                                    icon={<CloseOutlined/>}
                                    onClick={handleCancel}
                                    size="large"
                                    className="min-w-[100px]"
                                >
                                    Hủy
                                </Button>
                            )}

                            <Button
                                type="primary"
                                icon={isEditMode ? <SaveOutlined/> : <EditOutlined/>}
                                onClick={handleModeSwitch}
                                loading={loading}
                                size="large"
                                className="min-w-[120px]"
                            >
                                {isEditMode ? 'Lưu' : 'Chỉnh sửa'}
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>
        );
    }
);

FileDetailModal.displayName = 'FileDetailModal';

export default FileDetailModal;
