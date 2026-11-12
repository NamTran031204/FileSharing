/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import React, {useMemo} from "react";
import {useTableStore} from "@plugin-core/table/paged/hooks/useTableStore";
import {type IActionBtn} from "../OrdCrudPage";
import ExcelDropdown from "@plugin-core/shared/excel/ExcelDropdown";
import {usePermissionStrings, useResourcePermission} from "@plugin-core/auth/hooks/useResourcePermission";
import {
    type IGetPagedApiService,
    type IModifyApiService,
    type StaticCounterByStatusApiFetcher,
} from "@plugin-core/table/paged/types";
import {type ITableAction} from "@plugin-core/table/cells/TableActionCell";
import {type CommonResultDto} from "@plugin-core/http/dto";
import {type TableStoredState} from "@plugin-core/table/paged";
import {type StoreApi, type UseBoundStore} from "zustand";

interface IApiService extends IModifyApiService, IGetPagedApiService {

}

interface UseMasterDataLogicProps {
    permissionBase: string;
    apiService: IApiService;
    tableStore?: UseBoundStore<StoreApi<TableStoredState>>;
    useModifyModal: (reloadCallback: () => void) => {
        openCreateModal: (createInitialValues?: Record<string, any>) => void;
        openEditModal: (editingItem: Record<string, any>) => void;
        openDeleteConfirm: (deletingItem: Record<string, any>) => void;
        openViewModal: (viewingItem: Record<string, any>) => void;
    };
    onCreateArgs?: Record<string, any>; // Optional args for openCreateModal
    getCountByActiveFn?: StaticCounterByStatusApiFetcher;
    /** Slug không dấu, snake_case. VD: 'phong_ban'. Dùng để đặt tên file Excel xuất. */
    exportFileName?: string;
    /** Hide Excel import even if the user has Import permission. */
    disableImport?: boolean;
    onClickFn?: {
        viewDetail?: (data: any) => void;
        edit?: (data: any) => void;
        addNew?: () => void;
    },
    getDetailByIdFn?: (data: any) => Promise<CommonResultDto<any>>;
}

export const useMasterDataCrudPageLogic = ({
                                               permissionBase,
                                               apiService,
                                               useModifyModal,
                                               onCreateArgs = [],
                                               getCountByActiveFn,
                                               exportFileName,
                                               disableImport = false,
                                               onClickFn,
                                               getDetailByIdFn,
                                               tableStore: tableStorePrm,
                                           }: UseMasterDataLogicProps) => {
    const resourcePermissions = useResourcePermission(permissionBase);
    const {permissions} = usePermissionStrings(permissionBase);
    // eslint-disable-next-line react-hooks/rules-of-hooks -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const tableStore = tableStorePrm || useTableStore(apiService);
    const {onExportExcel, onLoadData, setReloadStatusCounter} = tableStore();
    const canImport = resourcePermissions.canImport && !disableImport;


    const {
        openCreateModal,
        openEditModal,
        openDeleteConfirm,
        openViewModal
    } = useModifyModal(() => {
        // refresh table data
        onLoadData();
        setReloadStatusCounter();
    });

    const topActions: IActionBtn[] = useMemo(() => {
        const actions: IActionBtn[] = [];

        if (canImport || resourcePermissions.canExport) {
            actions.push({
                content: (
                    <ExcelDropdown
                        importRoute={canImport ? 'import' : undefined}
                        onExport={resourcePermissions.canExport ? () => onExportExcel(exportFileName ? {fileName: exportFileName} : undefined) : undefined}
                        disableImport={!canImport}
                        disableExport={!resourcePermissions.canExport}
                    />
                )
            });
        }

        if (resourcePermissions.canCreate) {
            actions.push({
                title: 'addNew',
                onClick: () => {
                    if (onClickFn?.addNew) {
                        onClickFn.addNew();
                    } else {
                        openCreateModal(onCreateArgs)
                    }
                }
            });
        }

        return actions;
    }, [canImport, resourcePermissions, onExportExcel, openCreateModal, onCreateArgs, exportFileName, onClickFn]);

    const getDetailDto = async (data: any) => {
        if (getDetailByIdFn) {
            const result = await getDetailByIdFn(data);
            return result?.data || {...data};
        }
        return data;
    }

    const tableActions: ITableAction<any>[] = useMemo(() => [
        {
            title: 'view',
            permission: permissions.getDetail,
            onClick: async (d: any) => {
                const detailDto = await getDetailDto(d);
                if (onClickFn && onClickFn?.viewDetail) {
                    onClickFn.viewDetail(detailDto);
                } else {
                    openViewModal(detailDto);
                }
            },
        },
        {
            title: 'edit',
            permission: permissions.update,
            onClick: async (d: any) => {
                const detailDto = await getDetailDto(d);
                if (onClickFn && onClickFn?.edit) {
                    onClickFn.edit(detailDto);
                } else {
                    openEditModal(detailDto);
                }
            },
        },
        {
            title: 'remove',
            permission: permissions.delete,
            onClick: openDeleteConfirm
        }
    ], [openViewModal, openEditModal, openDeleteConfirm]);

    return {
        tableStore,
        topActions,
        tableActions,
        counterService: getCountByActiveFn as StaticCounterByStatusApiFetcher,
        permissions,
        modalModify: {
            openCreateModal,
            openEditModal,
            openDeleteConfirm,
            openViewModal
        }
    };
};
