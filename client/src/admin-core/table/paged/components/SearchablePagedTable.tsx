/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import React, {forwardRef, useImperativeHandle} from 'react';
import {Form, type FormInstance, type TableProps} from 'antd';
import {type IGetPagedApiService, type StaticCounterByStatusApiFetcher} from "../types";
import {PagedTable} from "./PagedTable";
import {TableSearchForm} from "./TableSearchForm";
import {type SelectionStore} from '../hooks/useSelectionStoreFactory';
import {OrdCounterByStatusSegmented} from "@plugin-core/crud/counter-list/OrdCounterByStatusSegmented";
import {useTableStore} from "../hooks/useTableStore";
import {type TableStoredState} from "../hooks/useTableStoreFactory";
import {type StoreApi, type UseBoundStore} from "zustand";


export interface SearchablePagedTableProps<T = any> extends TableProps<T> {
    searchForm?: FormInstance;
    apiService?: IGetPagedApiService;
    tableStore?: UseBoundStore<StoreApi<TableStoredState>>;
    searchFields?: React.ReactNode;
    initialSearchParams?: Record<string, any>; // Search params để set sau khi reset
    counterByStatus?: {
        statusFieldName: string,
        fetcher: StaticCounterByStatusApiFetcher,
        initialValueStatus?: string | number | null | boolean
    },
    bulkActionToolbar?: React.ReactNode;
    onChangeDataTable?: (valueRowKeys: any[], data: any[], rowKey?: any) => void;
    /**
     * Zustand selection store tạo bởi `createSelectionStore()`.
     * Khi được truyền vào, table sẽ render cột checkbox/radio ở đầu.
     */
    selectionStore?: SelectionStore<T>;
}

export interface SearchablePagedTableRef {
    reloadData: () => void;
}

export const SearchablePagedTable = forwardRef(<T extends object>(
    {
        searchForm,
        apiService,
        searchFields,
        counterByStatus,
        bulkActionToolbar,
        initialSearchParams,
        tableStore,
        selectionStore,
        ...tableProps
    }: SearchablePagedTableProps<T>,
    ref: React.Ref<SearchablePagedTableRef>
) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    // @ts-ignore
    const internalTableStore = useTableStore(apiService);
    const usedTableStore = tableStore || internalTableStore;
    const [internalForm] = Form.useForm();
    const usedForm = searchForm || internalForm;
    const {onLoadData, setReloadStatusCounter} = usedTableStore();
    // Expose function(s) to parent
    useImperativeHandle(ref, () => ({
        reloadData: () => {
            onLoadData();
            setReloadStatusCounter();
        }
    }));
    return (
        <div className="ord-searchable-paged flex flex-col gap-4">
            <TableSearchForm tableStore={usedTableStore}
                             form={usedForm}
                             initialValues={initialSearchParams}>
                {searchFields}
                <Form.Item noStyle name={['extendUI', 'valueRowKeys']}></Form.Item>
            </TableSearchForm>
            {
                counterByStatus &&
                <div className={'mt-5'}>
                    <OrdCounterByStatusSegmented
                        {...counterByStatus}
                        tableStore={usedTableStore}
                    />
                </div>
            }
            {bulkActionToolbar}
            <PagedTable tableStore={usedTableStore}
                        {...tableProps}
                        initialSearchParams={initialSearchParams}
                        selectionStore={selectionStore}
                       showSettings={false}
            />
        </div>
    );
});

