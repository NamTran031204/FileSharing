import {useMemo, useState} from 'react';
import {message, Upload} from "antd";
import {DeleteOutlined, UploadOutlined} from "@ant-design/icons";
import {GetFileUrl} from "../../api/baseApi.ts";

interface Props {
    imageUrl?: string;
    onFileSelect?: (file: File | null) => void;
    setPreviewUrl?: (previewUrl: string) => void;
}

const UpdateDeleteAvatar = ({imageUrl, onFileSelect, setPreviewUrl}: Props) => {

    const [isModified, setIsModified] = useState<boolean>(false);
    const serverUrl = useMemo(() => {
        if (!imageUrl || imageUrl.trim() === '') return null;
        return GetFileUrl(imageUrl);
    }, [imageUrl]);

    const validateImage = (file: File): boolean => {
        const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
        if (!isValidType) {
            message.error('Chỉ hỗ trợ ảnh JPG, PNG');
            return false;
        }
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('Ảnh phải nhỏ hơn 5MB');
            return false;
        }
        return true;
    };

    const handleBeforeUpload = (file: File) => {
        const objectUrl = URL.createObjectURL(file);
        if (setPreviewUrl) {
            setPreviewUrl(objectUrl);
        }

        if (onFileSelect && validateImage(file)) {
            onFileSelect(file);
            setIsModified(true);
        }

        return false;
    };

    const removeImage = () => {
        if (isModified) {
            if (setPreviewUrl) {
                setPreviewUrl(serverUrl!);
            }
            setIsModified(false);
        } else {
            if (setPreviewUrl) {
                setPreviewUrl('/images/default_avatar.jpg');
            }
        }
    };

    return (
        <>
            <div className={"flex flex-col items-center gap-2"}>
                <div
                    className="absolute inset-0 flex flex-row items-center justify-center rounded-full opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity">
                    <Upload
                        showUploadList={false}
                        beforeUpload={handleBeforeUpload}
                        accept="image/*"
                    >
                        <UploadOutlined
                            className={"text-white m-1 text-xl rounded-3xl p-2 hover:bg-amber-50 hover:text-black cursor-pointer"}/>
                    </Upload>
                    <DeleteOutlined
                        className="text-white m-1 text-xl rounded-3xl p-2 hover:bg-amber-50 hover:text-black cursor-pointer"
                        onClick={removeImage}
                    ></DeleteOutlined>

                </div>

            </div>
        </>
    );
};

export default UpdateDeleteAvatar;
