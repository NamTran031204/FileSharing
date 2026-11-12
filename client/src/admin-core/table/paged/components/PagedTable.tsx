/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import React, {useEffect, useMemo} from 'react';
import {Table, type TableProps} from 'antd';
import {type ColumnType} from 'antd/es/table/interface';
import {type UseBoundStore} from 'zustand/react';
import {type StoreApi} from 'zustand/vanilla';
import {type TableStoredState} from '../hooks/useTableStoreFactory';
import './styles/enhanced-table.css';
import './styles/stick-header.css';
import {OrdDataListView} from "./DataListView";
import {type SelectionStore, useTableRowSelectionConfig} from '../hooks/useSelectionStoreFactory';
import {useTableSettings} from '../settings';
import {useAutoListTitle} from '../hooks/useAutoListTitle';

export interface PagedTableProps<T> extends TableProps<T> {
    tableStore: UseBoundStore<StoreApi<TableStoredState>>;
    initialSearchParams?: Record<string, any>;
    isHiddenPagination?: boolean;
    onChangeDataTable?: (valueRowKeys: any[], data: any[], rowKey: string | any) => void;
    /**
     * Zustand selection store tạo bởi `createSelectionStore()`.
     * Khi được truyền vào, table sẽ render cột checkbox/radio ở đầu.
     * Store quản lý selection độc lập và hỗ trợ giữ lại selection khi phân trang.
     */
    selectionStore?: SelectionStore<T>;
    /** Hiển thị thanh density + column-toggle phía trên bảng. Mặc định true. */
    showSettings?: boolean;
    /**
     * Tiêu đề hiển thị cạnh thanh settings (vd "Danh sách nhiệm vụ khảo sát").
     * Mặc định tự suy ra từ menu đăng ký theo route hiện tại. Truyền `false` để ẩn.
     */
    listTitle?: React.ReactNode | false;
    /** Ẩn title tự sinh từ menu; `listTitle` tường minh vẫn hiển thị. Mặc định false. */
    isHiddenListTitle?: boolean;
    /** Key lưu column visibility / density. Mặc định = pathname. */
    tableKey?: string;
}

export const PagedTableToolbar = ({
                                      title,
                                      settingsBar
                                  }: {
    title?: React.ReactNode;
    settingsBar: React.ReactNode;
}) => (
    <div className="ord-table-toolbar">
        <span className="ord-table-title">{title}</span>
        {settingsBar}
    </div>
);

// eslint-disable-next-line react-refresh/only-export-components -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
export const resolveTableScroll = (scroll?: TableProps<any>['scroll']): TableProps<any>['scroll'] => ({
    x: 'max-content',
    ...scroll,
});

// eslint-disable-next-line react-refresh/only-export-components -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
export const resolveListTitle = (
    listTitle: React.ReactNode | false | undefined,
    autoListTitle: React.ReactNode,
    isHiddenListTitle: boolean,
): React.ReactNode | undefined =>
    listTitle === false ? undefined : (listTitle ?? (isHiddenListTitle ? undefined : autoListTitle));

export const PagedTable = <T extends object>(props: PagedTableProps<T>) => {
    const {
        tableStore,
        initialSearchParams,
        isHiddenPagination = false,
        onChangeDataTable,
        selectionStore,
        pagination,
        showSettings = true,
        listTitle,
        isHiddenListTitle = false,
        tableKey,
        columns: propColumns,
        size: propSize,
        title: propTitle,
        ...tableProps
    } = props;

    const {
        data,
        loading
    } = tableStore();

    const autoListTitle = useAutoListTitle();
    const resolvedListTitle = resolveListTitle(listTitle, autoListTitle, isHiddenListTitle);

    const rowKey = useMemo(() => {
        return tableProps.rowKey || 'view_id';
    }, [tableProps.rowKey]);

    // memo hóa valueKeys để không map lại liên tục
    const valueKeys = useMemo(() => data.map(it => it[rowKey]), [data, rowKey]);

    const usedPagination = useMemo(() => {
        if (isHiddenPagination) return false;
        return pagination || {};
    }, [pagination, isHiddenPagination]);

    // Luôn gọi hook (React rules of Hooks) — output chỉ dùng khi showSettings=true
    const settings = useTableSettings({
        columns: (propColumns ?? []) as ColumnType<any>[],
        tableKey,
        defaultDensity: (propSize as any) || 'middle',
    });

    const resolvedColumns = showSettings ? settings.processedColumns : propColumns;
    const resolvedSize = showSettings ? settings.size : propSize;
    const resolvedTitle = showSettings
        ? () => (
            <PagedTableToolbar title={resolvedListTitle} settingsBar={settings.settingsBar}/>
        )
        : propTitle;

    // Luôn gọi hook (React rules) — trả undefined nếu không có selectionStore
    const selectionRowConfig = useTableRowSelectionConfig<T>(selectionStore);

    useEffect(() => {
        if (onChangeDataTable) {
            onChangeDataTable(valueKeys, data, rowKey);
        }
        // Thông báo cho selection store khi dữ liệu trang thay đổi
        if (selectionStore) {
            selectionStore.getState()._notifyPageDataChanged(valueKeys, rowKey as string);
        }
    }, [valueKeys, data, rowKey, onChangeDataTable, selectionStore]);

    return (
        <div className={`enhanced-table density-${resolvedSize ?? 'middle'}`}>
            <MemoizedOrdDataListView
                tableStore={tableStore}
                initialSearchParams={initialSearchParams}
                pagination={usedPagination}
                renderListContent={(dataList: any[]) => (
                    <Table
                        {...tableProps}
                        columns={resolvedColumns as any}
                        size={resolvedSize}
                        title={resolvedTitle}
                        // selectionStore được ưu tiên; fallback về rowSelection từ tableProps
                        rowSelection={selectionRowConfig ?? tableProps.rowSelection}
                        dataSource={dataList}
                        loading={loading}
                        pagination={false}
                        scroll={resolveTableScroll(tableProps.scroll)}
                        rowKey={rowKey}
                    />
                )}
            />
        </div>
    );
};

// Memo hóa OrdDataListView để giảm render
const MemoizedOrdDataListView = React.memo(OrdDataListView);
