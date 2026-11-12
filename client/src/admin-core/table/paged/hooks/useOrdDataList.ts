/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {useCallback, useEffect, useState} from "react";
import {type UseBoundStore, type StoreApi} from "zustand";
import {type TableStoredState} from "./useTableStoreFactory";
import {useDebouncedCallback} from "@plugin-core/shared/hooks/useDebouncedCallback";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
export function useOrdDataList<TData>(
    tableStore: UseBoundStore<StoreApi<TableStoredState>>,
    initialSearchParams?: Record<string, any>
) {
    const {
        data,
        page,
        pageSize,
        searchParams,
        setLoading,
        onLoadData,
        reset,
        setInitialSearchParams,
        loading
    } = tableStore();

    const [tick, setTick] = useState(0);

    // Gán initial search params - chỉ chạy 1 lần khi mount
    useEffect(() => {
        if (initialSearchParams) {
            setInitialSearchParams(initialSearchParams || {});
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Reset store khi mount
    useEffect(() => {
        reset(initialSearchParams);
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            await onLoadData();
        } finally {
            setLoading(false);
        }
    }, [onLoadData, setLoading]);

    const debounceLoadData = useDebouncedCallback(loadData, 100);

    // Trigger load khi tick thay đổi
    useEffect(() => {
        if (tick > 0) {
            debounceLoadData();
        }
    }, [tick]);

    // Trigger tick khi pagination hoặc search thay đổi
    useEffect(() => {
        setTick(prev => prev + 1);
    }, [page, pageSize, searchParams]);

    return {
        data,
        loading,
        page,
        pageSize,
    };
}
