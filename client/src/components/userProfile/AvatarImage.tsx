import {Avatar} from "antd";
import {useEffect, useMemo, useState} from "react";
import UpdateDeleteAvatar from "./UpdateDeleteAvatar.tsx";
import {GetFileUrl} from "../../api/baseApi.ts";
import {UserIcon} from "./UserIcon.tsx";


interface Props {
    imageUrl?: string;
    onFileSelect?: (file: File | null) => void;
    isCreateOrUpdate?: boolean;
}

const AvatarImage = ({
                         imageUrl, onFileSelect, isCreateOrUpdate
                     }: Props) => {

    const [previewUrl, setPreviewUrl] = useState<string | undefined>('');

    const serverUrl = useMemo(() => {
        if (!imageUrl || imageUrl.trim() === '') return "src/assets/userProfile/user.svg";
        return GetFileUrl(imageUrl);
    }, [imageUrl]);

    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    useEffect(() => {
        setPreviewUrl(serverUrl!);
    }, [isCreateOrUpdate, imageUrl]);

    const displayUrl = previewUrl || serverUrl;
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative group">
                <Avatar size={150}
                        icon={<UserIcon style={{marginTop: '13px'}}/>}
                        src={displayUrl}
                > </Avatar>

                {isCreateOrUpdate && (
                    <UpdateDeleteAvatar imageUrl={imageUrl} onFileSelect={onFileSelect} setPreviewUrl={setPreviewUrl}/>
                )}
            </div>
        </div>
    );
};

export default AvatarImage;
