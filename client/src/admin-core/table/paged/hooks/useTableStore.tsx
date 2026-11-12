/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
// import {useMemo} from "react";
// import {createTableStore} from "./useTableStoreFactory";
// import {IGetPagedApiService} from "../types";
//
// export const useTableStore = (apiService: IGetPagedApiService) => {
//     return useMemo(() => createTableStore(apiService), []);
// };

// useTableStore.ts
import {createTableStore} from "./useTableStoreFactory";
import {type IGetPagedApiService} from "../types";

// Cache để tránh tạo lại store nhiều lần
const tableStoreInstances = new Map<any, ReturnType<typeof createTableStore>>();

interface TableStoreOptions {
    initialSearchParams?: Record<string, any>
}

/**
 * Hàm tạo hoặc lấy store instance (dùng được cả trong & ngoài React)
 */
export const getTableStore = (apiService: IGetPagedApiService, options?: TableStoreOptions) => {
    let keyStore: any = apiService;
    if (options) {
        keyStore = keyStore + JSON.stringify(options.initialSearchParams)
    }
    if (!tableStoreInstances.has(keyStore)) {
        const {initialSearchParams} = options || {};
        tableStoreInstances.set(keyStore, createTableStore(apiService, initialSearchParams));
    }
    return tableStoreInstances.get(keyStore)!;
};

/**
 * Hook React: chỉ là wrapper của getTableStore
 */
export const useTableStore = (apiService: IGetPagedApiService, options?: TableStoreOptions) => {
    return getTableStore(apiService, options);
};
