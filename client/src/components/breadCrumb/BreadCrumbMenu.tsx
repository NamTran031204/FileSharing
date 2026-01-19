import {useEffect, useRef, useState} from 'react';
import {
    DeleteOutlined,
    DownloadOutlined,
    EditOutlined,
    InfoCircleOutlined,
    MailOutlined,
    MoreOutlined,
    RotateLeftOutlined,
    ShareAltOutlined
} from '@ant-design/icons';
import DownloadButton from "./DownloadButton.tsx";
import FileDetailModal, {type FileDetailModalRef} from '../file/FileDetailModal';
import EmailSender, {type ShareFileModalRef} from '../file/EmailSender.tsx';
import type {MetadataEntity} from "../../api/fileApi/userFileApiResource.ts";
import fileApiResource from "../../api/fileApi/fileApiResource.ts";
import {message} from 'antd';
import {hasPermission} from '../../utils/permissionUtils';
import {FileAppPermission} from "../../api/enums.ts";

interface Props {
    file: MetadataEntity;
    isTrashItem?: boolean;
    onRefresh?: () => void;
}

interface MenuOption {
    key: string;
    label: string;
    icon: React.ReactNode;
    danger?: boolean;
    onClick: () => void;
}

const BreadCrumbMenu = ({file, isTrashItem = false, onRefresh}: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showDownload, setShowDownload] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const fileDetailModalRef = useRef<FileDetailModalRef>(null);
    const shareFileModalRef = useRef<ShareFileModalRef>(null);

    // Lấy quyền của user hiện tại từ file entity
    const fileAppPermission = file.publishUserPermission || FileAppPermission.PUBLIC;

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
        setIsOpen(false);
        fileDetailModalRef.current?.open(file);
    };

    const handleDownload = () => {
        setIsOpen(false);
        setShowDownload(true);
    };

    const handleDownloadComplete = () => {
        setShowDownload(false);
    };

    const handleEdit = () => {
        setIsOpen(false);
        fileDetailModalRef.current?.open(file);
    };

    const handleDelete = async () => {
        setIsOpen(false);
        try {
            await fileApiResource.moveToTrash(file.fileId);
            message.success('File moved to trash successfully');
            onRefresh?.();
        } catch (error) {
            message.error('Failed to move file to trash');
            console.error('Move to trash error:', error);
        }
    };

    const handleRestore = async () => {
        setIsOpen(false);
        try {
            await fileApiResource.restoreFileFromTrash(file.fileId);
            message.success('File restored successfully');
            onRefresh?.();
        } catch (error) {
            message.error('Failed to restore file');
            console.error('Restore error:', error);
        }
    };

    const handleSendEmail = () => {
        setIsOpen(false);
        shareFileModalRef.current?.open(file);
    };

    const handleShare = () => {
        setIsOpen(false);
        fileDetailModalRef.current?.open(file);
    };

    // Dynamic menu options based on isTrashItem and fileAppPermission
    const menuOptions: MenuOption[] = isTrashItem
        ? [
            {
                key: 'restore',
                label: 'Khôi phục',
                icon: <RotateLeftOutlined/>,
                onClick: handleRestore,
            },
        ]
        : [
            // Base (PUBLIC): Chi tiết + Tải xuống
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
            // >= READ/COMMENT: Thêm Gửi Email
            ...(hasPermission(fileAppPermission, FileAppPermission.READ) ? [{
                key: 'sendEmail',
                label: 'Gửi Email',
                icon: <MailOutlined/>,
                onClick: handleSendEmail,
            }] : []),
            // >= MODIFY: Thêm Chia sẻ
            ...(hasPermission(fileAppPermission, FileAppPermission.MODIFY) ? [{
                key: 'share',
                label: 'Chia sẻ',
                icon: <ShareAltOutlined/>,
                onClick: handleShare,
            }] : []),
            // OWNER: Thêm Chỉnh sửa
            ...(fileAppPermission === FileAppPermission.OWNER ? [{
                key: 'edit',
                label: 'Chỉnh sửa',
                icon: <EditOutlined/>,
                onClick: handleEdit,
            }] : []),
            // OWNER: Thêm Xóa file
            ...(fileAppPermission === FileAppPermission.OWNER ? [{
                key: 'delete',
                label: 'Xóa file',
                icon: <DeleteOutlined/>,
                danger: true,
                onClick: handleDelete,
            }] : []),
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
                <MoreOutlined className="text-lg"/>
            </button>

            {isOpen && (
                <div
                    className="
            absolute right-0 mt-2 w-48 z-50
            bg-popover rounded-xl shadow-xl
            border border-border
            py-2 overflow-hidden
            animate-in fade-in-0 zoom-in-95 duration-200 bg-blue-100
          "
                >
                    {menuOptions.map((option, index) => (
                        <div key={option.key}>
                            {option.danger && index > 0 && <div className="border-t border-border my-1"/>}

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
                    objectName={file.objectName}
                    fileName={file.fileName}
                    fileSize={file.fileSize}
                    autoStart={true}
                    onComplete={handleDownloadComplete}
                />
            )}

            <FileDetailModal
                ref={fileDetailModalRef}
                onFileUpdated={() => {
                    // TODO: Refresh file list
                    console.log('File updated');
                }}
                onFileDeleted={() => {
                    // TODO: Refresh file list
                    console.log('File deleted');
                }}
            />

            <EmailSender ref={shareFileModalRef} />
        </div>
    );
};

export default BreadCrumbMenu;