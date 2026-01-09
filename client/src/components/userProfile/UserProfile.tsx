import {useEffect, useState} from 'react';
import {Button, Card, Form, Input, message, Spin} from 'antd';
import {CloseOutlined, EditOutlined, SaveOutlined} from '@ant-design/icons';
import AvatarImage from './AvatarImage';
import userApiResource, {type UpdateUserRequestDto, type UserDto} from "../../api/userApiResource.ts";
import fileApiResource from "../../api/fileApi/fileApiResource.ts";

interface UserProfileProps {
    mode?: 'view' | 'edit';
    onModeChange?: (mode: 'view' | 'edit') => void;
}

const UserProfile = ({mode = 'view', onModeChange}: UserProfileProps) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<UserDto | null>(null);
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

    const isEditMode = mode === 'edit';

    // Fetch user data
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setFetchLoading(true);
                const data = await userApiResource.getCurrentUser();
                if (!data) {
                    throw new Error('User data is null');
                }
                console.log("data", data);
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
        // file có thể là File object (upload mới) hoặc null (xóa ảnh/giữ nguyên)
        setPendingAvatarFile(file);
    };

    const handleEdit = () => {
        onModeChange?.('edit');
    };

    const handleCancel = () => {
        // Reset form về giá trị ban đầu
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
            <div className="flex justify-center items-center min-h-[400px]">
                <Spin size="large"/>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Card
                className="max-w-2xl mx-auto shadow-lg border-border"
                styles={{
                    header: {
                        background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--info)) 100%)',
                        borderRadius: '0.75rem 0.75rem 0 0',
                    },
                }}
                title={
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-primary-foreground">
                            Hồ sơ người dùng
                        </span>
                        {!isEditMode && (
                            <Button
                                type="text"
                                icon={<EditOutlined/>}
                                onClick={handleEdit}
                                className="text-primary-foreground hover:bg-primary-foreground/20"
                            >
                                Chỉnh sửa
                            </Button>
                        )}
                    </div>
                }
            >
                <div className="flex flex-col items-center mb-8">
                    <AvatarImage
                        imageUrl={userInfo?.avatarUrl || undefined}
                        isCreateOrUpdate={isEditMode}
                        onFileSelect={handleFileSelectFromChild}
                    />
                </div>

                <Form form={form} layout="vertical" onFinish={onSave} className="space-y-4">
                    <Form.Item
                        label={<span className="font-medium text-foreground">Tên người dùng</span>}
                        name="publicUserName"
                        rules={[{required: true, message: 'Vui lòng nhập tên người dùng'}]}
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
                    >
                        <Input
                            placeholder="Email"
                            className="h-11 rounded-lg"
                            disabled
                        />
                    </Form.Item>

                    {isEditMode && (
                        <div className="flex justify-end gap-3 pt-4">
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
            </Card>
        </div>
    );
};

export default UserProfile;