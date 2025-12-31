import {Avatar, Upload} from "antd";
import {UploadOutlined, UserOutlined} from "@ant-design/icons";
import {useEffect, useState} from "react";

interface AvatarImageProps {
    src?: string;
    onFileSelect?: (file: File | null) => void;
    editable?: boolean;
}

const AvatarImage = ({src, onFileSelect, editable = false}: AvatarImageProps) => {
    const [previewUrl, setPreviewUrl] = useState<string | undefined>(src);

    // Đồng bộ khi src từ cha thay đổi (load data lần đầu)
    useEffect(() => {
        setPreviewUrl(src);
    }, [src]);

    // Cleanup blob url khi unmount để tránh memory leak
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleBeforeUpload = (file: File) => {
        // 1. Tạo preview ngay lập tức
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        // 2. Đẩy file gốc ra cho cha giữ
        if (onFileSelect) {
            onFileSelect(file);
        }

        // 3. Return false để chặn Antd tự upload
        return false;
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative group">
                <Avatar
                    size={150}
                    icon={<UserOutlined/>}
                    src={previewUrl} // Hiển thị state nội bộ
                    className="border-2 border-gray-200"
                />
                {editable && (
                    <div
                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 overflow-hidden">
                        <Upload
                            showUploadList={false}
                            beforeUpload={handleBeforeUpload}
                            accept="image/*"
                            // VISUAL TRICK:
                            // 1. w-full h-full: Ép Upload component to bằng cha
                            // 2. [&>.ant-upload-select]:... : Ép thẻ span nội bộ của Antd to bằng cha
                            className="w-full h-full block [&>.ant-upload-select]:w-full [&>.ant-upload-select]:h-full"
                        >
                            {/* Vùng click (Trigger Area) chiếm trọn không gian */}
                            <div
                                className="w-full h-full flex flex-col items-center justify-center text-white cursor-pointer">
                                <UploadOutlined style={{fontSize: '24px'}}/>
                                <span className="text-xs mt-1 font-semibold">Đổi ảnh</span>
                            </div>
                        </Upload>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AvatarImage;
