/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
/**
 * CrudPage - Component tổng hợp cho trang CRUD danh mục
 *
 * Gom toàn bộ boilerplate (useLogic, tableStore, columns, layout) vào 1 component.
 * Plugin entity chỉ cần truyền config.
 */

import React from "react";
import TableUtil from "@plugin-core/table/utils/table.util";
import {PagedTable} from "@plugin-core/table/paged";
import {PageLayoutWithTable} from "@plugin-core/table/paged/components/PageLayoutWithTable";
import {OrdCounterByStatusSegmented} from "./counter-list/OrdCounterByStatusSegmented";
import {useMasterDataCrudPageLogic} from "./hook/useMasterDataCrudPageLogic";
import {useCrudModal} from "@plugin-core/modal/GlobalModalManager/hook/useCrudModal";
import {type ColumnsType} from "antd/es/table";
import {type SelectionStore} from "@plugin-core/table/paged/hooks/useSelectionStoreFactory";

export interface CrudPageProps<TPagedDto = any, TDetailDto = any> {
    /** Permission base string, VD: "MasterData.Country" */
    permissionBase: string;
    /** API service (generated hoặc mock) */
    apiService: any;
    /** Entity translation key trong modify-modal.json, VD: "country" */
    entityTranslationNs: string;
    /** Hàm trả về columns config */
    getColumns: () => ColumnsType<TPagedDto>;
    /** Search form component */
    searchForm: React.ReactNode;
    /** Entity form component (trong modal create/edit) */
    entityForm: React.ReactNode;
    /** Modal width (default: 500) */
    modalWidth?: number;
    /** Transform dữ liệu cho notification message */
    transformNotification?: (item: TDetailDto) => Record<string, any>;
    /** Giá trị mặc định khi tạo mới */
    createInitialValues?: Record<string, any>;
    /** Status field name cho counter (default: 'isActived') */
    statusFieldName?: string;
    /** Zustand selection store tạo bởi createSelectionStore() — thêm cột checkbox vào table */
    selectionStore?: SelectionStore<TPagedDto>;
    /** Slug không dấu, snake_case. VD: 'quoc_gia'. Dùng để đặt tên file Excel xuất. */
    exportFileName?: string;
}

export const CrudPage = <TPagedDto extends object = any, TDetailDto extends object = any>({
                                                                                              permissionBase,
                                                                                              apiService,
                                                                                              entityTranslationNs,
                                                                                              getColumns,
                                                                                              searchForm,
                                                                                              entityForm,
                                                                                              modalWidth = 500,
                                                                                              transformNotification = (x: any) => ({name: x?.name}),
                                                                                              createInitialValues,
                                                                                              statusFieldName,
                                                                                              selectionStore,
                                                                                              exportFileName,
                                                                                          }: CrudPageProps<TPagedDto, TDetailDto>) => {

    const useModifyModal = (onSaved?: () => void) => {
        return useCrudModal<TPagedDto>({
            apiService,
            entityTranslationNs,
            transformNotificationParameter: transformNotification as any,
            modalProps: {width: modalWidth},
            formFields: entityForm,
            onSaved,
        });
    };

    const {
        tableStore,
        topActions,
        tableActions,
        counterService,
    } = useMasterDataCrudPageLogic({
        permissionBase,
        apiService,
        useModifyModal: useModifyModal as never,
        onCreateArgs: createInitialValues,
        getCountByActiveFn: apiService.getCountByActive,
        exportFileName,
    });

    const columns = TableUtil.getColumns<TPagedDto>(
        [...getColumns()] as any,
        {actions: tableActions},
    );

    return (
        <PageLayoutWithTable
            topActions={topActions}
            searchFields={searchForm}
            tableStore={tableStore}>
            {
                statusFieldName && <OrdCounterByStatusSegmented
                    tableStore={tableStore}
                    statusFieldName={statusFieldName}
                    fetcher={counterService}/>
            }

            <PagedTable isHiddenListTitle columns={columns} tableStore={tableStore} selectionStore={selectionStore}/>
        </PageLayoutWithTable>
    );
};
