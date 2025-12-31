import {useEffect, useState} from "react";
import {Button, Card, Form, Input, message, Spin} from "antd";
import {SaveOutlined} from "@ant-design/icons";
import AvatarImage from "./AvatarImage"; // Import component con vừa sửa
// Giả lập import API Service
// import { FileAppServiceService } from "@api/pos/FileAppServiceService";
// import { UserApiResourceService } from "@api/pos/UserApiResourceService";

const UserProfile = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // --- STATE QUẢN LÝ DỮ LIỆU ---
    // 1. Data User hiện tại (Lấy từ API getById)
    const [userInfo, setUserInfo] = useState<any>(null);

    // 2. File ảnh mới (Tạm thời nằm ở RAM, chưa gửi lên Server)
    // Đây là biến quan trọng nhất để quyết định luồng Save
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

    // Giả lập load data ban đầu
    useEffect(() => {
        // Mock API call
        setTimeout(() => {
            const mockData = {
                id: 1,
                fullName: "Nguyễn Văn A",
                description: "Backend Developer",
                imageId: "old-image-guid-123", // ID ảnh cũ trên server
                imageUrl: "https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png" // URL ảnh cũ
            };
            setUserInfo(mockData);
            form.setFieldsValue(mockData);
        }, 1000);
    }, [form]);

    // --- LOGIC XỬ LÝ SỰ KIỆN TỪ CON ---
    const handleFileSelectFromChild = (file: File) => {
        console.log("Cha đã nhận được file từ con:", file.name);
        setPendingAvatarFile(file); // Cất vào kho, chưa làm gì cả
    };

    // --- LOGIC SAVE (TRỌNG TÂM) ---
    const onSave = async () => {
        try {
            // Validate form thông tin cơ bản trước
            const values = await form.validateFields();
            setLoading(true);

            let finalImageId = userInfo?.imageId; // Mặc định dùng ID cũ

            // BƯỚC 1: KIỂM TRA XEM CÓ ẢNH MỚI KHÔNG?
            if (pendingAvatarFile) {
                console.log("Phát hiện ảnh mới, đang upload...");
                const formData = new FormData();
                formData.append('file', pendingAvatarFile);

                // Gọi API Upload ảnh
                // const uploadRes = await FileAppServiceService.uploadFile(formData);

                // Giả lập API trả về
                const uploadRes = await new Promise<any>(resolve =>
                    setTimeout(() => resolve({data: {data: {id: "new-image-guid-999"}}}), 1000)
                );

                if (uploadRes?.data?.data?.id) {
                    finalImageId = uploadRes.data.data.id; // Cập nhật ID mới
                    console.log("Upload ảnh thành công, ID mới:", finalImageId);
                }
            }

            // BƯỚC 2: GỬI TOÀN BỘ DATA USER (Kèm ID ảnh chuẩn)
            const submitData = {
                ...userInfo,     // ID user, các trường cũ
                ...values,       // Tên, mô tả mới từ Form
                imageId: finalImageId // ID ảnh (cũ hoặc mới)
            };

            console.log("Đang lưu User Profile với data:", submitData);

            // Gọi API Update User
            // await UserApiResourceService.update(submitData);
            await new Promise(resolve => setTimeout(resolve, 500)); // Giả lập

            message.success("Cập nhật hồ sơ thành công!");
            setPendingAvatarFile(null); // Reset file tạm sau khi save thành công

        } catch (error) {
            console.error(error);
            message.error("Có lỗi xảy ra khi lưu thông tin.");
        } finally {
            setLoading(false);
        }
    };

    if (!userInfo) return <Spin className="flex justify-center mt-10"/>;

    return (
        <Card title="Hồ sơ người dùng" className="max-w-2xl mx-auto mt-10 shadow-md">
            <div className="flex flex-col items-center mb-6">
                {/* COMPONENT CON: AVATAR IMAGE
                   - src: Truyền URL ảnh hiện tại xuống để hiển thị
                   - editable: Cho phép sửa
                   - onFileSelect: Hàm nhận hàng (File) từ con
                */}
                <AvatarImage
                    src={userInfo.imageUrl}
                    editable={true}
                    onFileSelect={handleFileSelectFromChild}
                />
                <span className="text-gray-400 text-sm mt-2">Chạm vào ảnh để thay đổi</span>
            </div>

            <Form form={form} layout="vertical" onFinish={onSave}>
                <Form.Item label="Họ và tên" name="fullName" rules={[{required: true}]}>
                    <Input placeholder="Nhập họ tên"/>
                </Form.Item>

                <Form.Item label="Mô tả" name="description">
                    <Input.TextArea rows={3} placeholder="Giới thiệu bản thân"/>
                </Form.Item>

                <div className="flex justify-end mt-4">
                    <Button
                        type="primary"
                        htmlType="submit" // Kích hoạt onFinish của Form -> gọi onSave
                        loading={loading}
                        icon={<SaveOutlined/>}
                    >
                        Lưu thay đổi
                    </Button>
                </div>
            </Form>
        </Card>
    );
};

export default UserProfile;