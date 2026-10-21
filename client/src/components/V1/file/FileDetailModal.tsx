import {forwardRef, useImperativeHandle, useState} from 'react';
import {Button, Divider, Form, Input, message, Modal, Select} from 'antd';
import {CloseOutlined, DeleteOutlined, EditOutlined, EyeOutlined, SaveOutlined} from '@ant-design/icons';
import userFileApiResource, {type MetadataEntity} from '../../../api/fileApi/userFileApiResource.ts';
import fileApiResource from '../../../api/fileApi/fileApiResource.ts';
import {FileViewUtil} from '../../../utils/FileViewUtil.ts';
import {FileAppPermission, ObjectPermission, ObjectVisibility} from "../../../api/enums.ts";
import UserFilePermissionList, {type UserPermission} from './UserFilePermissionList.tsx';
import {hasPermission} from '../../../utils/permissionUtils.ts';
import i18n from '../../../i18n';

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

                form.setFieldsValue({
                    fileName: file.fileName,
                    mimeType: file.mimeType,
                    fileSize: FileViewUtil.formatBytes(file.fileSize),
                    compressionAlgo: file.compressionAlgo || i18n.t('file:fileDetailModal.none'),
                    ownerId: file.ownerId,
                    timeToLive: file.timeToLive,
                    publicPermission: file.publicPermission,
                    visibility: file.visibility,
                });

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
                compressionAlgo: currentFile.compressionAlgo || i18n.t('file:fileDetailModal.none'),
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

                const updatedFile = await userFileApiResource.updateFileDetail(currentFile.fileId, updateData);

                setCurrentFile(updatedFile);
                setUserPermissions(updatedFile.userFilePermissions || []);
                setOriginalPermissions(updatedFile.userFilePermissions || []);

                form.setFieldsValue({
                    fileName: updatedFile.fileName,
                    mimeType: updatedFile.mimeType,
                    fileSize: FileViewUtil.formatBytes(updatedFile.fileSize),
                    compressionAlgo: updatedFile.compressionAlgo || i18n.t('file:fileDetailModal.none'),
                    ownerId: updatedFile.ownerId,
                    timeToLive: updatedFile.timeToLive,
                    publicPermission: updatedFile.publicPermission,
                    visibility: updatedFile.visibility,
                });

                message.success(i18n.t('file:fileDetailModal.capNhatFileThanhCong'));
                setMode('view');
                onFileUpdated?.();
            } catch (error) {
                console.error('Update error:', error);
                message.error(i18n.t('file:fileDetailModal.coLoiXayRaKhi'));
            } finally {
                setLoading(false);
            }
        };

        const handleDelete = () => {
            if (!currentFile) return;

            Modal.confirm({
                title: i18n.t('file:fileDetailModal.xacNhanXoaFile'),
                content: i18n.t('file:fileDetailModal.banCoChacChanMuon'),
                okText: i18n.t('file:fileDetailModal.xoa'),
                okType: 'danger',
                cancelText: i18n.t('file:fileDetailModal.huy'),
                onOk: async () => {
                    try {
                        setDeleteLoading(true);
                        await fileApiResource.moveToTrash(currentFile.fileId);
                        message.success(i18n.t('file:fileDetailModal.daChuyenFileVaoThung'));
                        handleClose();
                        onFileDeleted?.();
                    } catch (error) {
                        console.error('Delete error:', error);
                        message.error(i18n.t('file:fileDetailModal.coLoiXayRaKhi2'));
                    } finally {
                        setDeleteLoading(false);
                    }
                },
            });
        };

        const permissionOptions = [
            {label: i18n.t('file:fileDetailModal.readOnly'), value: ObjectPermission.READ},
            {label: i18n.t('file:fileDetailModal.comment'), value: ObjectPermission.COMMENT},
            {label: i18n.t('file:fileDetailModal.modify'), value: ObjectPermission.MODIFY},
        ];

        const visibilityOptions = [
            {label: i18n.t('file:fileDetailModal.private'), value: ObjectVisibility.PRIVATE},
            {label: i18n.t('file:fileDetailModal.public'), value: ObjectVisibility.PUBLIC},
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
            message.success(i18n.t('file:fileDetailModal.daThem', {email}));
        };

        const fileAppPermission = currentFile?.publishUserPermission || FileAppPermission.PUBLIC;

        console.log("current file", currentFile);
        return (
            <Modal
                title={
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-semibold">
                            {isEditMode ? i18n.t('file:fileDetailModal.chinhSuaFile') : i18n.t('file:fileDetailModal.chiTietFile')}
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
                                label={<span className="font-medium">{i18n.t('file:fileDetailModal.tenFile')}</span>}
                                name="fileName"
                                rules={[{required: true, message: i18n.t('file:fileDetailModal.vuiLongNhapTenFile')}]}
                                className="mb-4"
                            >
                                <Input
                                    disabled={!isEditMode}
                                    placeholder={i18n.t('file:fileDetailModal.nhapTenFile')}
                                    className={!isEditMode ? 'bg-muted' : ''}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span className="font-medium">{i18n.t('file:fileDetailModal.loaiFile')}</span>}
                                name="mimeType"
                                className="mb-4"
                            >
                                <Input disabled className="bg-muted"/>
                            </Form.Item>

                            <Form.Item
                                label={<span className="font-medium">{i18n.t('file:fileDetailModal.kichThuoc')}</span>}
                                name="fileSize"
                                className="mb-4"
                            >
                                <Input disabled className="bg-muted"/>
                            </Form.Item>

                            <Form.Item
                                label={<span className="font-medium">{i18n.t('file:fileDetailModal.thuatToanNen')}</span>}
                                name="compressionAlgo"
                                className="mb-4"
                            >
                                <Input disabled className="bg-muted"/>
                            </Form.Item>

                            {hasPermission(fileAppPermission, FileAppPermission.READ) && (
                                <Form.Item
                                    label={<span className="font-medium">{i18n.t('file:fileDetailModal.ownerId')}</span>}
                                    name="ownerId"
                                    className="mb-4"
                                >
                                    <Input disabled className="bg-muted"/>
                                </Form.Item>
                            )}

                            <Form.Item
                                label={<span className="font-medium">{i18n.t('file:fileDetailModal.thoiGianLuuTruGiay')}</span>}
                                name="timeToLive"
                                rules={[{required: true, message: i18n.t('file:fileDetailModal.vuiLongNhapThoiGian')}]}
                                className="mb-4"
                            >
                                <Input
                                    type="number"
                                    disabled={!isEditMode}
                                    placeholder={i18n.t('file:fileDetailModal.nhapThoiGianGiay')}
                                    className={!isEditMode ? 'bg-muted' : ''}
                                />
                            </Form.Item>

                            {hasPermission(fileAppPermission, FileAppPermission.READ) && (
                                <Form.Item
                                    label={<span className="font-medium">{i18n.t('file:fileDetailModal.quyenCongKhai')}</span>}
                                    name="publicPermission"
                                    rules={[{required: true, message: i18n.t('file:fileDetailModal.vuiLongChonQuyen')}]}
                                    className="mb-4"
                                >
                                    <Select
                                        disabled={!isEditMode}
                                        options={permissionOptions}
                                        placeholder={i18n.t('file:fileDetailModal.chonQuyen')}
                                        className={!isEditMode ? 'bg-muted' : ''}
                                    />
                                </Form.Item>
                            )}

                            {hasPermission(fileAppPermission, FileAppPermission.READ) && (
                                <Form.Item
                                    label={<span className="font-medium">{i18n.t('file:fileDetailModal.cheDoHienThi')}</span>}
                                    name="visibility"
                                    rules={[{required: true, message: i18n.t('file:fileDetailModal.vuiLongChonCheDo')}]}
                                    className="mb-4"
                                >
                                    <Select
                                        disabled={!isEditMode}
                                        options={visibilityOptions}
                                        placeholder={i18n.t('file:fileDetailModal.chonCheDoHienThi')}
                                        className={!isEditMode ? 'bg-muted' : ''}
                                    />
                                </Form.Item>
                            )}
                        </div>

                        {hasPermission(fileAppPermission, FileAppPermission.MODIFY) && (
                            <Form.Item
                                label={<span className="font-medium">{i18n.t('file:fileDetailModal.quyenChiaSeVoiNguoi')}</span>}
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
                            {i18n.t('file:fileDetailModal.xoaFile')}
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
                                    {i18n.t('file:fileDetailModal.huy')}
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
                                {isEditMode ? i18n.t('file:fileDetailModal.luu') : i18n.t('file:fileDetailModal.chinhSua')}
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
