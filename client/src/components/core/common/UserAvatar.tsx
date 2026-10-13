import {useState, type CSSProperties} from 'react';
import {Avatar, Tooltip} from 'antd';
import {UserOutlined} from '@ant-design/icons';
import {GetFileUrl} from '../../../api/baseApi.ts';
import {getUserInitials} from '../../../utils/user.util.ts';

export interface UserAvatarProps {
    name?: string;
    email?: string;
    /** Object name (qua GetFileUrl) hoac URL day du (blob:/data:/http/duong dan goc) */
    avatarUrl?: string | null;
    size?: number;
    /** Bat tooltip hien ten day du (name, nguoc lai email) */
    tooltip?: boolean;
    className?: string;
    style?: CSSProperties;
}

const DIRECT_URL = /^(blob:|data:|http|\/)/;

const resolveSrc = (avatarUrl?: string | null): string | undefined => {
    const value = avatarUrl?.trim();
    if (!value) return undefined;
    return DIRECT_URL.test(value) ? value : GetFileUrl(value);
};

/**
 * Hien thi user thong nhat: anh -> chu viet tat (name -> email) -> icon.
 * Chu mau primary tren nen muted.
 */
const UserAvatar = ({name, email, avatarUrl, size = 32, tooltip, className, style}: UserAvatarProps) => {
    const src = resolveSrc(avatarUrl);
    // luu src loi (khong phai co) de doi anh moi thi tu thu lai
    const [failedSrc, setFailedSrc] = useState<string | undefined>();
    const showImage = !!src && failedSrc !== src;
    const initials = getUserInitials({name, email});

    const avatar = (
        <Avatar
            size={size}
            src={showImage ? src : undefined}
            onError={() => {
                setFailedSrc(src);
                return false;
            }}
            icon={!showImage && !initials ? <UserOutlined/> : undefined}
            className={className}
            style={{
                backgroundColor: 'var(--color-muted)',
                color: 'var(--color-primary)',
                fontWeight: 700,
                fontSize: Math.round(size * 0.4),
                ...style,
            }}
        >
            {showImage ? undefined : initials}
        </Avatar>
    );

    const title = name?.trim() || email;
    return tooltip && title ? <Tooltip title={title}>{avatar}</Tooltip> : avatar;
};

export default UserAvatar;
