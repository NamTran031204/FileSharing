/**
 * UserFilePage
 * 
 * Trang quản lý File của tôi.
 * Sử dụng GenericCrudPage với UserFileStore.
 */

import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { 
    Button, 
    Select, 
    Space, 
    Tag, 
    Tooltip, 
    Popconfirm,
    Row,
    Col,
    Form,
    DatePicker,
} from 'antd';
import { 
    EditOutlined, 
    DeleteOutlined, 
    DownloadOutlined,
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    ShareAltOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

// Core imports
import { GenericCrudPage, type SearchFormRenderProps } from '../../core/base';

// Store
import { getUserFileStore, type UserFileFilter } from './UserFileStore';

// Components
import FileDetailModal, { type FileDetailModalRef } from '../../components/file/FileDetailModal';

// Types & Utils
import type { MetadataEntity } from '../../api/fileApi/userFileApiResource';
import { FileViewUtil } from '../../utils/FileViewUtil';
import { UploadStatus } from '../../api/enums';

// Services
import { downloadService } from '../../service/downloadService';

// ==================== Constants ====================

const MIME_TYPE_OPTIONS = [
    { label: 'Tất cả', value: '' },
    { label: 'Hình ảnh', value: 'image' },
    { label: 'Video', value: 'video' },
    { label: 'Audio', value: 'audio' },
    { label: 'Tài liệu', value: 'application/pdf' },
    { label: 'Văn bản', value: 'text' },
];

const STATUS_OPTIONS = [
    { label: 'Tất cả', value: '' },
    { label: 'Đang upload', value: UploadStatus.UPLOADING },
    { label: 'Hoàn thành', value: UploadStatus.COMPLETED },
    { label: 'Thất bại', value: UploadStatus.FAILED },
];

// ==================== Status Tag Component ====================

const StatusTag: React.FC<{ status: UploadStatus }> = ({ status }) => {
    const statusConfig = {
        [UploadStatus.UPLOADING]: { color: 'processing', text: 'Đang upload' },
        [UploadStatus.COMPLETED]: { color: 'success', text: 'Hoàn thành' },
        [UploadStatus.FAILED]: { color: 'error', text: 'Thất bại' },
    };
    
    const config = statusConfig[status] || { color: 'default', text: status };
    
    return <Tag color={config.color}>{config.text}</Tag>;
};

// ==================== File Type Icon Component ====================

const FileTypeIcon: React.FC<{ mimeType: string }> = ({ mimeType }) => {
    const group = FileViewUtil.getFileGroup(mimeType);
    
    const iconMap: Record<string, { icon: string; color: string }> = {
        image: { icon: '🖼️', color: '#1890ff' },
        video: { icon: '🎥', color: '#722ed1' },
        audio: { icon: '🎵', color: '#13c2c2' },
        document: { icon: '📄', color: '#fa541c' },
        code: { icon: '💻', color: '#52c41a' },
        text: { icon: '📝', color: '#faad14' },
        archive: { icon: '📦', color: '#eb2f96' },
        other: { icon: '📎', color: '#8c8c8c' },
    };
    
    const config = iconMap[group] || iconMap.other;
    
    return (
        <Tooltip title={mimeType}>
            <span style={{ fontSize: '18px', marginRight: '8px' }}>{config.icon}</span>
        </Tooltip>
    );
};

// ==================== Search Form Component ====================

interface UserFileSearchFormProps extends SearchFormRenderProps<UserFileFilter> {}

const UserFileSearchForm: React.FC<UserFileSearchFormProps> = observer(({
    filter,
    onFilterChange,
    onSearch,
    onReset,
    isLoading,
}) => {
    const [form] = Form.useForm();
    
    const handleSearch = () => {
        onSearch();
    };
    
    const handleReset = () => {
        form.resetFields();
        onReset();
    };
    
    const handleMimeTypeChange = (value: string) => {
        onFilterChange('mimeType', value || null);
    };
    
    const handleStatusChange = (value: string) => {
        onFilterChange('status', (value || null) as UploadStatus | null);
    };
    
    const handleDateChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
        if (dates) {
            onFilterChange('creationTimestampStartDate', dates[0]?.toISOString() ?? null);
            onFilterChange('creationTimestampEndDate', dates[1]?.toISOString() ?? null);
        } else {
            onFilterChange('creationTimestampStartDate', null);
            onFilterChange('creationTimestampEndDate', null);
        }
    };
    
    const handleIncludeSharedChange = (checked: boolean) => {
        onFilterChange('isIncludeSharedFile', checked);
    };
    
    return (
        <Form form={form} layout="vertical">
            <Row gutter={16}>
                <Col xs={24} sm={12} md={6}>
                    <Form.Item label="Loại file">
                        <Select
                            placeholder="Chọn loại file"
                            options={MIME_TYPE_OPTIONS}
                            value={filter.mimeType || ''}
                            onChange={handleMimeTypeChange}
                            allowClear
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                </Col>
                
                <Col xs={24} sm={12} md={6}>
                    <Form.Item label="Trạng thái">
                        <Select
                            placeholder="Chọn trạng thái"
                            options={STATUS_OPTIONS}
                            value={filter.status || ''}
                            onChange={handleStatusChange}
                            allowClear
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                </Col>
                
                <Col xs={24} sm={12} md={6}>
                    <Form.Item label="Ngày tạo">
                        <DatePicker.RangePicker
                            style={{ width: '100%' }}
                            onChange={handleDateChange}
                            format="DD/MM/YYYY"
                        />
                    </Form.Item>
                </Col>
                
                <Col xs={24} sm={12} md={6}>
                    <Form.Item label="Bao gồm file được chia sẻ">
                        <Select
                            value={filter.isIncludeSharedFile ? 'true' : 'false'}
                            onChange={(value) => handleIncludeSharedChange(value === 'true')}
                            options={[
                                { label: 'Không', value: 'false' },
                                { label: 'Có', value: 'true' },
                            ]}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                </Col>
            </Row>
            
            <Row>
                <Col span={24}>
                    <Space>
                        <Button 
                            type="primary" 
                            icon={<SearchOutlined />}
                            onClick={handleSearch}
                            loading={isLoading}
                        >
                            Tìm kiếm
                        </Button>
                        <Button 
                            icon={<ReloadOutlined />}
                            onClick={handleReset}
                        >
                            Đặt lại
                        </Button>
                    </Space>
                </Col>
            </Row>
        </Form>
    );
});

// ==================== Main Page Component ====================

const UserFilePage: React.FC = observer(() => {
    // Get store instance
    const store = useMemo(() => getUserFileStore(), []);
    
    // Ref for FileDetailModal
    const modalRef = useRef<FileDetailModalRef>(null);
    
    // Set modal ref to store
    useEffect(() => {
        if (modalRef.current) {
            store.setModalRef(modalRef.current);
        }
    }, [store]);
    
    // ==================== Handlers ====================
    
    const handleView = useCallback((record: MetadataEntity) => {
        modalRef.current?.open(record);
    }, []);
    
    const handleEdit = useCallback((record: MetadataEntity) => {
        modalRef.current?.open(record);
    }, []);
    
    const handleDelete = useCallback(async (record: MetadataEntity) => {
        await store.moveToTrash(record.fileId);
    }, [store]);
    
    const handleDownload = useCallback(async (record: MetadataEntity) => {
        try {
            await downloadService.downloadAndSave(record.objectName, record.fileName);
        } catch (error) {
            console.error('Download error:', error);
        }
    }, []);
    
    const handleFileUpdated = useCallback(() => {
        store.fetchData();
    }, [store]);
    
    const handleFileDeleted = useCallback(() => {
        store.fetchData();
    }, [store]);
    
    // ==================== Table Columns ====================
    
    const columns: ColumnsType<MetadataEntity> = useMemo(() => [
        {
            title: 'Tên file',
            dataIndex: 'fileName',
            key: 'fileName',
            ellipsis: true,
            sorter: true,
            render: (text: string, record: MetadataEntity) => (
                <Space>
                    <FileTypeIcon mimeType={record.mimeType} />
                    <Tooltip title={text}>
                        <span className="font-medium">{text}</span>
                    </Tooltip>
                    {record.visibility === 'PUBLIC' && (
                        <Tooltip title="File công khai">
                            <ShareAltOutlined className="text-blue-500" />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
        {
            title: 'Loại file',
            dataIndex: 'mimeType',
            key: 'mimeType',
            width: 150,
            ellipsis: true,
            render: (mimeType: string) => (
                <Tooltip title={mimeType}>
                    <Tag>{FileViewUtil.getFileGroup(mimeType)}</Tag>
                </Tooltip>
            ),
        },
        {
            title: 'Kích thước',
            dataIndex: 'fileSize',
            key: 'fileSize',
            width: 120,
            sorter: true,
            render: (size: number) => FileViewUtil.formatBytes(size),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'creationTimestamp',
            key: 'creationTimestamp',
            width: 160,
            sorter: true,
            render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: UploadStatus) => <StatusTag status={status} />,
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 180,
            fixed: 'right',
            render: (_: unknown, record: MetadataEntity) => (
                <Space size="small">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="text"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => handleView(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Tải xuống">
                        <Button
                            type="text"
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={() => handleDownload(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Chuyển vào thùng rác"
                        description="Bạn có chắc chắn muốn chuyển file này vào thùng rác?"
                        onConfirm={() => handleDelete(record)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Xóa">
                            <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                loading={store.isMovingToTrash}
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ], [handleView, handleEdit, handleDownload, handleDelete, store.isMovingToTrash]);
    
    // ==================== Render Props ====================
    
    const renderSearchForm = useCallback((props: SearchFormRenderProps<UserFileFilter>) => (
        <UserFileSearchForm {...props} />
    ), []);
    
    // ==================== Top Actions ====================
    
    const topActions = useMemo(() => (
        <Button 
            icon={<ReloadOutlined />}
            onClick={() => store.fetchData()}
            loading={store.isLoading}
        >
            Làm mới
        </Button>
    ), [store]);
    
    // ==================== Render ====================
    
    return (
        <div className="p-6">
            <GenericCrudPage<MetadataEntity, UserFileFilter>
                store={store}
                columns={columns}
                renderSearchForm={renderSearchForm}
                topActions={topActions}
                title="Quản lý File của tôi"
                rowKey="fileId"
                scroll={{ x: 1000 }}
                tableSize="middle"
                emptyText="Bạn chưa có file nào. Hãy tải lên file đầu tiên!"
                loadingTip="Đang tải danh sách file..."
            />
            
            {/* FileDetailModal - sử dụng component hiện có */}
            <FileDetailModal
                ref={modalRef}
                onFileUpdated={handleFileUpdated}
                onFileDeleted={handleFileDeleted}
            />
        </div>
    );
});

export default UserFilePage;
