/**
 * GenericCrudPage Component
 * 
 * Render Props & Composition Pattern.
 * Component này đóng vai trò là "Khung sườn" (Skeleton),
 * nhận vào các render functions và config để hiển thị.
 * 
 * Separation of Concern: Logic phân trang/loading được tách biệt khỏi UI.
 */

import React, { useEffect, useCallback, type ReactNode } from 'react';
import { observer } from 'mobx-react-lite';
import { Table, Card, Modal, Spin, Empty, Space } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import type { BaseListStore } from './BaseListStore';

// ==================== Types & Interfaces ====================

/**
 * Props cho search form render function
 */
export interface SearchFormRenderProps<TFilter> {
    filter: TFilter;
    onFilterChange: <K extends keyof TFilter>(key: K, value: TFilter[K]) => void;
    onSearch: () => void;
    onReset: () => void;
    isLoading: boolean;
}

/**
 * Props cho modal form render function
 */
export interface ModalFormRenderProps<TEntity> {
    visible: boolean;
    item: TEntity | null;
    onClose: () => void;
    onSave: (data: Partial<TEntity>) => Promise<boolean>;
    isSaving: boolean;
}

/**
 * Props cho action column render function
 */
export interface ActionColumnRenderProps<TEntity> {
    record: TEntity;
    onEdit: (item: TEntity) => void;
    onDelete: (id: string) => Promise<boolean>;
    onView: (item: TEntity) => void;
}

/**
 * Props cho GenericCrudPage
 */
export interface GenericCrudPageProps<
    TEntity extends object,
    TFilter extends object
> {
    /** MobX Store instance */
    store: BaseListStore<TEntity, TFilter>;
    
    /** Table columns configuration */
    columns: ColumnsType<TEntity>;
    
    /** Render function cho search form */
    renderSearchForm?: (props: SearchFormRenderProps<TFilter>) => ReactNode;
    
    /** Render function cho modal form */
    renderModalForm?: (props: ModalFormRenderProps<TEntity>) => ReactNode;
    
    /** Top actions (buttons like "Create New") */
    topActions?: ReactNode;
    
    /** Page title */
    title?: string;
    
    /** Row key field name */
    rowKey?: string;
    
    /** Enable row selection */
    selectable?: boolean;
    
    /** On row selection change */
    onSelectionChange?: (selectedKeys: React.Key[], selectedRows: TEntity[]) => void;
    
    /** Selected row keys (controlled) */
    selectedRowKeys?: React.Key[];
    
    /** Card extra content */
    cardExtra?: ReactNode;
    
    /** Empty state description */
    emptyText?: string;
    
    /** Table scroll config */
    scroll?: { x?: number | string; y?: number | string };
    
    /** Auto fetch on mount */
    autoFetch?: boolean;
    
    /** Table size */
    tableSize?: 'small' | 'middle' | 'large';
    
    /** Show pagination size changer */
    showSizeChanger?: boolean;
    
    /** Page size options */
    pageSizeOptions?: string[];
    
    /** Custom class name */
    className?: string;
    
    /** Loading tip text */
    loadingTip?: string;
}

// ==================== Custom Hook: usePagination ====================

/**
 * Custom hook để tách biệt logic pagination
 */
function usePagination<TEntity extends object, TFilter extends object>(
    store: BaseListStore<TEntity, TFilter>,
    showSizeChanger: boolean,
    pageSizeOptions: string[]
): TablePaginationConfig {
    return {
        current: store.pagination.current,
        pageSize: store.pagination.pageSize,
        total: store.total,
        showSizeChanger,
        pageSizeOptions,
        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
        showQuickJumper: true,
    };
}

// ==================== Main Component ====================

function GenericCrudPageInner<
    TEntity extends object,
    TFilter extends object
>(props: GenericCrudPageProps<TEntity, TFilter>): React.ReactElement {
    const {
        store,
        columns,
        renderSearchForm,
        renderModalForm,
        topActions,
        title,
        rowKey = 'id',
        selectable = false,
        onSelectionChange,
        selectedRowKeys,
        cardExtra,
        emptyText = 'Không có dữ liệu',
        scroll,
        autoFetch = true,
        tableSize = 'middle',
        showSizeChanger = true,
        pageSizeOptions = ['10', '20', '50', '100'],
        className,
        loadingTip = 'Đang tải...',
    } = props;

    // ==================== Effects ====================
    
    useEffect(() => {
        if (autoFetch) {
            store.fetchData();
        }
        
        // Cleanup on unmount
        return () => {
            // Optional: Reset store on unmount
            // store.reset();
        };
    }, [store, autoFetch]);

    // ==================== Handlers ====================
    
    const handleTableChange = useCallback(
        (
            pagination: TablePaginationConfig,
            filters: Record<string, FilterValue | null>,
            sorter: SorterResult<TEntity> | SorterResult<TEntity>[]
        ) => {
            store.handleTableChange(
                { current: pagination.current, pageSize: pagination.pageSize },
                filters as Record<string, unknown>,
                Array.isArray(sorter) 
                    ? sorter.map(s => ({ field: s.field as string, order: s.order }))
                    : { field: sorter.field as string, order: sorter.order }
            );
        },
        [store]
    );

    const handleFilterChange = useCallback(
        <K extends keyof TFilter>(key: K, value: TFilter[K]) => {
            store.setFilter(key, value);
        },
        [store]
    );

    const handleSearch = useCallback(() => {
        store.handleSearch();
    }, [store]);

    const handleReset = useCallback(() => {
        store.handleReset();
    }, [store]);

    // These handlers are available for renderModalForm and action columns
    const _handleEdit = useCallback(
        (item: TEntity) => {
            store.openModal(item);
        },
        [store]
    );

    const _handleDelete = useCallback(
        async (id: string) => {
            return store.onDelete(id);
        },
        [store]
    );

    const _handleView = useCallback(
        (item: TEntity) => {
            store.openModal(item);
        },
        [store]
    );
    
    // Expose handlers for external use (suppress unused warnings)
    void _handleEdit;
    void _handleDelete;
    void _handleView;

    const handleModalClose = useCallback(() => {
        store.closeModal();
    }, [store]);

    const handleSave = useCallback(
        async (data: Partial<TEntity>) => {
            return store.onSave(data);
        },
        [store]
    );

    // ==================== Pagination Config ====================
    
    const paginationConfig = usePagination(store, showSizeChanger, pageSizeOptions);

    // ==================== Row Selection Config ====================
    
    const rowSelection = selectable
        ? {
              selectedRowKeys,
              onChange: (keys: React.Key[], rows: TEntity[]) => {
                  onSelectionChange?.(keys, rows);
              },
          }
        : undefined;

    // ==================== Render ====================
    
    return (
        <div className={className}>
            {/* Page Title */}
            {title && (
                <div className="mb-4">
                    <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
                </div>
            )}

            {/* Search Form */}
            {renderSearchForm && (
                <Card className="mb-4 shadow-sm">
                    {renderSearchForm({
                        filter: store.filter,
                        onFilterChange: handleFilterChange,
                        onSearch: handleSearch,
                        onReset: handleReset,
                        isLoading: store.isLoading,
                    })}
                </Card>
            )}

            {/* Main Content Card */}
            <Card 
                className="shadow-sm"
                extra={
                    <Space>
                        {cardExtra}
                        {topActions}
                    </Space>
                }
            >
                <Spin spinning={store.isLoading} tip={loadingTip}>
                    <Table<TEntity>
                        rowKey={rowKey}
                        columns={columns}
                        dataSource={store.items}
                        pagination={paginationConfig}
                        onChange={handleTableChange}
                        rowSelection={rowSelection}
                        size={tableSize}
                        scroll={scroll}
                        locale={{
                            emptyText: (
                                <Empty 
                                    description={emptyText}
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            ),
                        }}
                    />
                </Spin>
            </Card>

            {/* Modal Form */}
            {renderModalForm && (
                <>
                    {renderModalForm({
                        visible: store.modalVisible,
                        item: store.selectedItem,
                        onClose: handleModalClose,
                        onSave: handleSave,
                        isSaving: store.isSaving,
                    })}
                </>
            )}
        </div>
    );
}

// ==================== Export with Observer ====================

/**
 * GenericCrudPage wrapped with MobX observer
 * Tự động re-render khi store state thay đổi
 */
export const GenericCrudPage = observer(GenericCrudPageInner) as typeof GenericCrudPageInner;

// ==================== Utility Components ====================

/**
 * Confirmation Modal for Delete action
 */
export interface DeleteConfirmProps {
    visible: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
    itemName?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmProps> = ({
    visible,
    onConfirm,
    onCancel,
    loading = false,
    itemName = 'mục này',
}) => {
    return (
        <Modal
            title="Xác nhận xóa"
            open={visible}
            onOk={onConfirm}
            onCancel={onCancel}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading }}
        >
            <p>Bạn có chắc chắn muốn xóa {itemName}?</p>
        </Modal>
    );
};

export default GenericCrudPage;
