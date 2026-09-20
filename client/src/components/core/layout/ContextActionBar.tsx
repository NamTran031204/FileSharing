import {
    ArrowLeftOutlined,
    DownloadOutlined,
    EllipsisOutlined,
    LinkOutlined,
    ShareAltOutlined,
    TranslationOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Dropdown, Tooltip, type MenuProps } from 'antd';
import type { ReactNode } from 'react';

export interface ContextBarParticipant {
    key: string;
    name: string;
    initials: string;
}

export interface ContextActionBarProps {
    /** Ten muc dang mo — folder hien tai hoac ten project khi o goc */
    title: string;
    /** Duong dan rut gon hien ben trai title, vd: "Aurora Coffee rebrand / Raw footage" */
    pathLabel?: string;
    /** Danh sach thanh vien dang co quyen tren folder/project */
    participants?: ContextBarParticipant[];
    /** An nut back khi khong co noi de quay lai */
    onBack?: () => void;
    onShare?: () => void;
    onTranslate?: () => void;
    onDownload?: () => void;
    onCopyLink?: () => void;
    /** Cac muc bo sung trong menu "..." */
    moreItems?: MenuProps['items'];
    /** Slot phu o goc phai — vd: Tag trang thai, nut custom */
    right?: ReactNode;
}

const MAX_VISIBLE_AVATARS = 3;

/**
 * Thanh hanh dong theo ngu canh — nam ngay duoi AppHeader.
 *
 * Giu nguyen ngon ngu thiet ke cua ReviewTopBar (h-14, nen card, vien border)
 * nhung phuc vu cho folder/asset: Share, Translate, Download, Copy link.
 */
const ContextActionBar = ({
    title,
    pathLabel,
    participants = [],
    onBack,
    onShare,
    onTranslate,
    onDownload,
    onCopyLink,
    moreItems,
    right,
}: ContextActionBarProps) => {
    const items: MenuProps['items'] = [
        {
            key: 'copy-link',
            label: (
                <div className="flex items-center gap-2">
                    <LinkOutlined className="text-base" />
                    <span>Copy link</span>
                </div>
            ),
            onClick: onCopyLink,
        },
        ...(moreItems ?? []),
    ];

    return (
        <div className="z-20 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-6">
            {onBack && (
                <Tooltip title="Back">
                    <button
                        type="button"
                        onClick={onBack}
                        aria-label="Back"
                        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-foreground transition-all hover:bg-background hover:text-primary"
                    >
                        <ArrowLeftOutlined />
                    </button>
                </Tooltip>
            )}

            <div className="flex min-w-0 flex-col justify-center">
                {pathLabel && (
                    <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {pathLabel}
                    </span>
                )}
                <span className="truncate text-sm font-bold text-foreground">{title}</span>
            </div>

            <div className="flex-1" />

            {participants.length > 0 && (
                <Avatar.Group
                    max={{
                        count: MAX_VISIBLE_AVATARS,
                        style: { backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)', fontWeight: 700 },
                    }}
                    size={28}
                >
                    {participants.map((participant) => (
                        <Tooltip key={participant.key} title={participant.name}>
                            <Avatar
                                size={28}
                                style={{
                                    backgroundColor: 'var(--color-accent)',
                                    color: 'var(--color-foreground)',
                                    fontWeight: 800,
                                    fontSize: 10,
                                }}
                            >
                                {participant.initials}
                            </Avatar>
                        </Tooltip>
                    ))}
                </Avatar.Group>
            )}

            <div className="flex shrink-0 items-center gap-2">
                <Tooltip title="Translate file names and comments">
                    <Button
                        icon={<TranslationOutlined />}
                        onClick={onTranslate}
                        className="h-9 rounded-lg font-semibold"
                    >
                        <span className="hidden sm:inline">Translate</span>
                    </Button>
                </Tooltip>
                <Tooltip title="Download">
                    <Button
                        icon={<DownloadOutlined />}
                        onClick={onDownload}
                        className="h-9 rounded-lg font-semibold"
                        aria-label="Download"
                    />
                </Tooltip>
                <Button
                    type="primary"
                    icon={<ShareAltOutlined />}
                    onClick={onShare}
                    className="h-9 rounded-lg bg-linear-to-br from-primary-dark to-primary px-4 font-semibold shadow-md shadow-primary-dark/20"
                >
                    Share
                </Button>
                <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
                    <Button icon={<EllipsisOutlined />} className="h-9 rounded-lg" aria-label="More actions" />
                </Dropdown>
            </div>

            {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
        </div>
    );
};

export default ContextActionBar;
