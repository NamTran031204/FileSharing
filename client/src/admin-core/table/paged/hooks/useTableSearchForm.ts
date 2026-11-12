/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
import {useCallback, useEffect, useMemo} from "react";
import {Form, type FormInstance} from "antd";
import type {StoreApi, UseBoundStore} from "zustand";
import {type TableStoredState} from "./useTableStoreFactory";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
import {useDebouncedCallback, useThrottleCallback} from "@plugin-core/shared/hooks/useDebouncedCallback";

export function useTableSearchForm(
    form: FormInstance,
    tableStore: UseBoundStore<StoreApi<TableStoredState>>,
    initialValues?: Record<string, any>
) {
    const {
        setSearchParams,
        onLoadData,
        setReloadStatusCounter,
        reset,
        initialSearchParams: initialSearchParamsStore
    } = tableStore();
    // Signal fields
    const formUtil = {
        resetSearchParameter: Form.useWatch(['extendUI', 'onResetSearchParameter'], form),
        reloadTableData: Form.useWatch(['extendUI', 'onLoadDataTable'], form),
        reloadStatusCounter: Form.useWatch(['extendUI', 'reloadStatusCounter'], form),
    }

    // Memoized search
    const onSearch = useCallback(async () => {
        const values = form.getFieldsValue();
        setSearchParams({...values});
    }, [form, setSearchParams]);

    const handleSearch = useDebouncedCallback(onSearch, 250);

    // Handle reset
    useEffect(() => {
        if (formUtil.resetSearchParameter > 0) {
            form.resetFields();
            form.setFieldsValue({
                ...initialSearchParamsStore
            });
            reset(initialValues);
        }
    }, [formUtil.resetSearchParameter, form]);

    // Handle reload table data
    useEffect(() => {
        if (formUtil.reloadTableData > 0) {
            onLoadData();
        }
    }, [formUtil.reloadTableData, onLoadData]);

    // Handle reload status counter
    useEffect(() => {
        if (formUtil.reloadStatusCounter > 0) {
            setReloadStatusCounter();
        }
    }, [formUtil.reloadStatusCounter, setReloadStatusCounter]);

    // Init form với initialSearchParams - chỉ chạy 1 lần khi mount
    useEffect(() => {
        if (initialSearchParamsStore) {
            form.setFieldsValue({
                ...initialSearchParamsStore
            });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return {
        handleSearch
    };
}
