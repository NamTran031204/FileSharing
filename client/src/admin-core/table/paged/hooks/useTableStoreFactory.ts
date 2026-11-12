/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
// useTableStoreFactory.ts
import {create} from 'zustand';
import {type IGetPagedApiService} from "../types";
import {v4 as uuidv4} from "uuid";
import UiUtils from "@plugin-core/shared/utils/ui.utils";
import FileSaver from "file-saver";
import {type IRequestOptions} from "@plugin-core/shared/types/common.types";
import {buildExcelFileName} from "@plugin-core/shared/excel/excelFileName.util";

const OMIT_KEYS = [
    'isShowAdvanceSearch',
    'extendResetTick',
    'hotKeyScopeId',
    'onSearchBeginning',
    'extendUI'
];

export interface TableStoredState {
    data: any[];
    total: number;
    loading: boolean;
    page: number;
    pageSize: number;
    initialSearchParams: Record<string, any>;
    searchParams: Record<string, any>;
    reloadStatusCounter: number;
    setLoading: (loading: boolean) => void;
    setData: (data: any[], total: number) => void;
    setPagination: (page: number, pageSize: number) => void;
    setInitialSearchParams: (initialSearchParams: Record<string, any>) => void;
    setSearchParams: (params: Record<string, any>) => void;
    setSearchStatusParams: (params: Record<string, any>) => void;
    reset: (initSearchParams?: any) => void;
    onLoadData: () => Promise<void>;
    onExportExcel: (options?: { fileName: string }) => Promise<void>;
    setReloadStatusCounter: () => void;
    onRefreshData: () => void;
}

export const createTableStore = (service: IGetPagedApiService, initialSearchParams?: Record<string, any>) =>
    create<TableStoredState>((set, get) => {
        const incReloadCounter = () =>
            set(s => ({reloadStatusCounter: s.reloadStatusCounter + 1}));

        const cleanParams = (params: Record<string, any>) => {
            const result: Record<string, any> = {};
            for (const key in params) {
                if (!OMIT_KEYS.includes(key)) result[key] = params[key];
            }
            return result;
        };

        return {
            data: [],
            total: 0,
            loading: false,
            page: 1,
            pageSize: 10,
            initialSearchParams: initialSearchParams || {},
            searchParams: {},
            reloadStatusCounter: 0,

            setLoading: loading => set({loading}),
            setData: (data, total) => set({data, total}),
            setPagination: (page, pageSize) => set({page, pageSize}),
            setInitialSearchParams: (params: Record<string, any>) => {
                const {initialSearchParams} = get();
                set({
                    initialSearchParams: {
                        ...initialSearchParams,
                        ...params
                    }
                });
            },
            setSearchParams: params => {
                const {searchParams} = get();
                set({
                    searchParams: cleanParams({...searchParams, ...params}),
                    page: 1
                });
                incReloadCounter();
            },

            setSearchStatusParams: params =>
                set(s => ({searchParams: {...s.searchParams, ...params}})),

            reset: (initSearchParams?: any) => {
                const {initialSearchParams} = get();
                incReloadCounter();
                set({
                  //  data: [],
                  //  total: 0,
                    loading: false,
                    page: 1,
                    pageSize: 10,
                    searchParams: {...initialSearchParams, ...initSearchParams}
                });

            },

            setReloadStatusCounter: incReloadCounter,

            onLoadData: async () => {
                const {page, pageSize, searchParams} = get();
                const skipCount = (page - 1) * pageSize;
                const body = {skipCount, maxResultCount: pageSize, ...searchParams};

                const resultApi = await service.getPaged({
                    body: body
                });

                const items = resultApi.data?.items?.map((it: any, idx: number) => ({
                    ...it,
                    view_id: it?.encodedId || uuidv4(),
                    ordRowIndex: skipCount + idx + 1
                })) || [];

                set({
                    data: items,
                    total: Number(resultApi.data?.totalCount || 0)
                });
            },

            onExportExcel: async (options?: { fileName: string }) => {
                if (!service?.exportToExcel) return;

                UiUtils.setBusy();
                try {
                    const {searchParams} = get();
                    const requestOptions: IRequestOptions = {responseType: "blob"};
                    const resultBlob = await service.exportToExcel({body: searchParams}, requestOptions);
                    const fileName = buildExcelFileName('export', options?.fileName ?? 'export');

                    FileSaver.saveAs(resultBlob, fileName);
                } finally {
                    UiUtils.clearBusy();
                }
            },

            onRefreshData: () => {
                get().onLoadData();
                incReloadCounter();
            }
        };
    });
