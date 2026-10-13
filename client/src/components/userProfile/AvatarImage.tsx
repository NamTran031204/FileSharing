import {useEffect, useState} from "react";
import UpdateDeleteAvatar from "./UpdateDeleteAvatar.tsx";
import UserAvatar from "../core/common/UserAvatar.tsx";


interface Props {
    imageUrl?: string;
    name?: string;
    email?: string;
    onFileSelect?: (file: File | null) => void;
    isCreateOrUpdate?: boolean;
}

const AvatarImage = ({
                         imageUrl, name, email, onFileSelect, isCreateOrUpdate
                     }: Props) => {

    // previewUrl rong -> UserAvatar hien chu viet tat
    const [previewUrl, setPreviewUrl] = useState<string>(imageUrl ?? '');

    useEffect(() => {
        return () => {
            if (previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    useEffect(() => {
        setPreviewUrl(imageUrl ?? '');
    }, [isCreateOrUpdate, imageUrl]);

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative group">
                <UserAvatar
                    size={150}
                    avatarUrl={previewUrl}
                    name={name}
                    email={email}
                    className="ring-4 ring-border shadow-sm"
                />

                {isCreateOrUpdate && (
                    <UpdateDeleteAvatar imageUrl={imageUrl} onFileSelect={onFileSelect} setPreviewUrl={setPreviewUrl}/>
                )}
            </div>
        </div>
    );
};

export default AvatarImage;
