import {useEffect, useRef, useState} from 'react';
import {
    DeleteOutlined,
    DownloadOutlined,
    EditOutlined,
    InfoCircleOutlined,
    MailOutlined, MoreOutlined,
    ShareAltOutlined
} from '@ant-design/icons';
import DownloadButton from "./DownloadButton.tsx";
import fileApiResource from "../../api/fileApi/fileApiResource.ts";

interface Props {
    fileId: string;
    objectName: string;
    fileName: string;
    fileSize: number;
}

interface MenuOption {
    key: string;
    label: string;
    icon: React.ReactNode;
    danger?: boolean;
    onClick: () => void;
}

const BreadCrumbMenu = (prop: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showDownload, setShowDownload] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    // Handlers cho từng option
    const handleDetail = () => {
        console.log('Detail clicked:', prop.fileName);
        setIsOpen(false);
        // TODO: Implement detail logic
    };

    const handleDownload = () => {
        setIsOpen(false);
        setShowDownload(true);
    };

    const handleDownloadComplete = () => {
        setShowDownload(false);
    };

    const handleEdit = () => {
        console.log('Edit clicked:', prop.fileName);
        setIsOpen(false);
        // TODO: Implement edit logic
    };

    const handleDelete = async () => {
        console.log('Delete clicked:', prop.fileName);
        setIsOpen(false);
        await fileApiResource.moveToTrash(prop.fileId);
    };

    const handleSendEmail = () => {
        console.log('Send Email clicked:', prop.fileName);
        setIsOpen(false);
        // TODO: Implement send email logic
    };

    const handleShare = () => {
        console.log('Share clicked:', prop.fileName);
        setIsOpen(false);
        // TODO: Implement share logic
    };

    const menuOptions: MenuOption[] = [
        {
            key: 'detail',
            label: 'Chi tiết',
            icon: <InfoCircleOutlined/>,
            onClick: handleDetail,
        },
        {
            key: 'download',
            label: 'Tải xuống',
            icon: <DownloadOutlined/>,
            onClick: handleDownload,
        },
        {
            key: 'edit',
            label: 'Chỉnh sửa',
            icon: <EditOutlined/>,
            onClick: handleEdit,
        },
        {
            key: 'sendEmail',
            label: 'Gửi Email',
            icon: <MailOutlined/>,
            onClick: handleSendEmail,
        },
        {
            key: 'share',
            label: 'Chia sẻ',
            icon: <ShareAltOutlined/>,
            onClick: handleShare,
        },
        {
            key: 'delete',
            label: 'Xóa file',
            icon: <DeleteOutlined/>,
            danger: true,
            onClick: handleDelete,
        },
    ];

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={handleToggle}
                className={`
          w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200
          ${
                    isOpen
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }
        `}
                title="Menu"
            >
                <MoreOutlined className="text-lg" />
            </button>

            {isOpen && (
                <div
                    className="
            absolute right-0 mt-2 w-48 z-50
            bg-popover rounded-xl shadow-xl
            border border-border
            py-2 overflow-hidden
            animate-in fade-in-0 zoom-in-95 duration-200
          "
                >
                    {menuOptions.map((option, index) => (
                        <div key={option.key}>
                            {option.danger && index > 0 && <div className="border-t border-border my-1" />}

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    option.onClick();
                                }}
                                className={`
                  w-full px-4 py-2.5 text-left
                  flex items-center gap-3
                  transition-colors duration-150
                  ${
                                    option.danger
                                        ? 'text-destructive hover:bg-destructive/10'
                                        : 'text-popover-foreground hover:bg-muted'
                                }
                `}
                            >
                                <span className="text-base">{option.icon}</span>
                                <span className="text-sm font-medium">{option.label}</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {showDownload && (
                <DownloadButton
                    objectName={prop.objectName}
                    fileName={prop.fileName}
                    fileSize={prop.fileSize}
                    autoStart={true}
                    onComplete={handleDownloadComplete}
                />
            )}
        </div>
    );
};

export default BreadCrumbMenu;