import {useEffect, useRef, useState} from 'react';
import {
    DeleteOutlined,
    DownloadOutlined,
    EditOutlined,
    InfoCircleOutlined,
    MailOutlined,
    ShareAltOutlined,
    UnorderedListOutlined
} from '@ant-design/icons';
import DownloadButton from "./DownloadButton.tsx";

interface Props {
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

    const handleDelete = () => {
        console.log('Delete clicked:', prop.fileName);
        setIsOpen(false);
        // TODO: Implement delete logic
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
                    w-10 h-10 flex items-center justify-center
                    ${isOpen
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }
                `}
                title="Menu"
            >
                <UnorderedListOutlined className="text-lg"/>
            </button>

            {isOpen && (
                <div
                    className="
                        absolute right-0 mt-2 w-48 z-50
                        bg-white rounded-lg shadow-xl
                        border border-gray-200
                        py-1 overflow-hidden
                        animate-fade-in
                    "
                >
                    {menuOptions.map((option, index) => (
                        <div key={option.key}>
                            {option.danger && index > 0 && (
                                <div className="border-t border-gray-100 my-1"/>
                            )}

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    option.onClick();
                                }}
                                className={`
                                    w-full px-4 py-2.5 text-left
                                    flex items-center gap-3
                                    transition-colors duration-150
                                    ${option.danger
                                    ? 'text-red-600 hover:bg-red-50'
                                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
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