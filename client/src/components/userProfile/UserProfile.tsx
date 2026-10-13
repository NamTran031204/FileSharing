import {useEffect, useState} from 'react';
import {Button, Form, Input, message, Skeleton} from 'antd';
import {CloseOutlined, EditOutlined, SaveOutlined} from '@ant-design/icons';
import AvatarImage from './AvatarImage';
import userApiResource, {type UpdateUserRequestDto, type UserDto} from "../../api/userApiResource.ts";
import fileApiResource from "../../api/fileApi/fileApiResource.ts";

interface UserProfileProps {
    mode?: 'view' | 'edit';
    onModeChange?: (mode: 'view' | 'edit') => void;
}

// gop timestamp thanh dd/mm/yyyy theo he tieng viet
const formatJoinDate = (isoTimestamp?: string) => {
    if (!isoTimestamp) return '—';
    return new Intl.DateTimeFormat('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric'})
        .format(new Date(isoTimestamp));
};

const UserProfile = ({mode = 'view', onModeChange}: UserProfileProps) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<UserDto | null>(null);
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

    const isEditMode = mode === 'edit';

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setFetchLoading(true);
                const data = await userApiResource.getCurrentUser();
                if (!data) {
                    throw new Error('User data is null');
                }
                setUserInfo(data);
                form.setFieldsValue({
                    publicUserName: data.publicUserName,
                    email: data.email,
                });
            } catch (error) {
                console.error('Error fetching user:', error);
                message.error('Không thể tải thông tin người dùng');
            } finally {
                setFetchLoading(false);
            }
        };

        fetchUserData();
    }, [form]);

    const handleFileSelectFromChild = (file: File | null) => {
        setPendingAvatarFile(file);
    };

    const handleEdit = () => {
        onModeChange?.('edit');
    };

    const handleCancel = () => {
        form.setFieldsValue({
            publicUserName: userInfo?.publicUserName,
            email: userInfo?.email,
        });
        setPendingAvatarFile(null);
        onModeChange?.('view');
    };

    const onSave = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            let finalAvatarUrl = userInfo?.avatarUrl || null;

            if (pendingAvatarFile) {
                try {
                    const objectName = await fileApiResource.directUpload(pendingAvatarFile);
                    finalAvatarUrl = objectName;
                } catch (uploadError) {
                    console.error('Upload avatar error:', uploadError);
                    message.error('Không thể upload ảnh đại diện');
                    setLoading(false);
                    return;
                }
            }

            const updateData: UpdateUserRequestDto = {
                publicUserName: values.publicUserName,
                avatarUrl: finalAvatarUrl,
            };

            const updatedUser = await userApiResource.updateUser(userInfo!.userId, updateData);

            setUserInfo(updatedUser);
            message.success('Cập nhật hồ sơ thành công!');
            setPendingAvatarFile(null);
            onModeChange?.('view');

        } catch (error) {
            console.error('Save error:', error);
            message.error('Có lỗi xảy ra khi lưu thông tin.');
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
        return (
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 bg-card border border-border rounded-2xl p-8">
                    <Skeleton.Avatar active size={120} shape="circle" className="block mx-auto mb-4"/>
                    <Skeleton active paragraph={{rows: 2}} title={{width: '60%'}}/>
                </div>
                <div className="md:col-span-2 bg-card border border-border rounded-2xl p-8">
                    <Skeleton active paragraph={{rows: 4}}/>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <aside
                className="md:col-span-1 bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center">
                <AvatarImage
                    imageUrl={userInfo?.avatarUrl || undefined}
                    name={userInfo?.publicUserName}
                    email={userInfo?.email}
                    isCreateOrUpdate={isEditMode}
                    onFileSelect={handleFileSelectFromChild}
                />

                <h2 className="mt-4 text-lg font-semibold text-foreground">
                    {userInfo?.publicUserName}
                </h2>
                <p className="text-sm text-muted-foreground break-all">
                    {userInfo?.email}
                </p>

                <span
                    className={`mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        userInfo?.isActive
                            ? 'bg-primary/10 text-primary'
                            : 'bg-destructive/10 text-destructive'
                    }`}
                >
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${userInfo?.isActive ? 'bg-primary' : 'bg-destructive'}`}
                    />
                    {userInfo?.isActive ? 'Đang hoạt động' : 'Đã khoá'}
                </span>

                <p className="mt-3 text-xs text-muted-foreground">
                    Tham gia từ {formatJoinDate(userInfo?.creationTimestamp)}
                </p>
            </aside>

            <section className="md:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-8 py-5 border-b border-border">
                    <span className="text-base font-semibold text-foreground">
                        Thông tin tài khoản
                    </span>
                    {!isEditMode && (
                        <Button type="text" icon={<EditOutlined/>} onClick={handleEdit}>
                            Chỉnh sửa
                        </Button>
                    )}
                </div>

                <div className="px-8 py-8">
                    <Form form={form} layout="vertical" onFinish={onSave}>
                        <Form.Item
                            label={<span className="font-medium text-foreground">Tên người dùng</span>}
                            name="publicUserName"
                            rules={[{required: true, message: 'Vui lòng nhập tên người dùng'}]}
                            className="!mb-8"
                        >
                            <Input
                                placeholder="Nhập tên người dùng"
                                className="h-11 rounded-lg"
                                disabled={!isEditMode}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="font-medium text-foreground">Email</span>}
                            name="email"
                            extra={<span className="text-xs text-muted-foreground">Email không thể thay đổi</span>}
                            className="!mb-0"
                        >
                            <Input
                                placeholder="Email"
                                className="h-11 rounded-lg"
                                disabled
                            />
                        </Form.Item>

                        {isEditMode && (
                            <div className="flex justify-end gap-3 mt-8">
                                <Button
                                    icon={<CloseOutlined/>}
                                    size="large"
                                    onClick={handleCancel}
                                    className="h-11 px-6"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    icon={<SaveOutlined/>}
                                    size="large"
                                    className="h-11 px-8 font-semibold"
                                >
                                    Lưu thay đổi
                                </Button>
                            </div>
                        )}
                    </Form>
                </div>
            </section>
        </div>
    );
};

export default UserProfile;
