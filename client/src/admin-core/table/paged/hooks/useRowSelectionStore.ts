/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {type TableRowSelection} from 'antd/es/table/interface';
import {create} from 'zustand';
import {subscribeWithSelector} from 'zustand/middleware';
import React, {useCallback, useMemo} from 'react';

export interface UseRowSelectionResult<T> {
    rowSelection: TableRowSelection<any>;
    selectedRowKeys: React.Key[];
    selectedRows: T[];
    clearSelection: () => void;
    onChangeTableData: (rowKeys: React.Key[], rows: any[], rowKey: string) => void;

    // Extended functionality
    isSelected: (key: React.Key) => boolean;
    hasSelection: boolean;
    selectionCount: number;

    // Utility methods
    selectByCondition: (
        rows: T[],
        condition: (row: T) => boolean,
        getKey: (row: T) => React.Key
    ) => void;
}

interface RowSelectionState<T> {
    selectedRowKeys: React.Key[];
    selectedRows: T[];
    currentPageKeys: React.Key[];
    rowKey: string;

    setSelection: (keys: React.Key[], rows: T[], preserveSelection: boolean) => void;
    clearSelection: () => void;
    isSelected: (key: React.Key) => boolean;

    onChangeTableData: (rowKeys: React.Key[], rows: any[], rowKey: string) => void;
}

export interface RowSelectionConfig<T = any> {
    isRowDisabled?: (record: T) => boolean | null | undefined;
    maxSelection?: number;
    onSelectionChange?: (keys: React.Key[], rows: T[]) => void;
    preserveSelection?: boolean; // Giữ selection khi data thay đổi
    type?: 'checkbox' | 'radio';
}

// Store factory để tránh conflict giữa các instances
const createRowSelectionStore = <T>() => create<RowSelectionState<T>>()(
    subscribeWithSelector((set, get) => ({
        selectedRowKeys: [],
        selectedRows: [],
        currentPageKeys: [],
        rowKey: '',
        setSelection: (keys, rows, preserveSelection: boolean) => {
            if (!preserveSelection) {
                set({
                    selectedRowKeys: keys,
                    selectedRows: rows
                });
                return;
            }
            const {currentPageKeys, selectedRows, selectedRowKeys, rowKey} = get();
            // Giữ lại selections từ trang khác
            const otherPageKeys = new Set(
                selectedRowKeys.filter(key => !currentPageKeys.includes(key))
            );
            // Hợp nhất keys mới + keys từ trang khác
            const newAllSelectedKeys = new Set([...otherPageKeys, ...keys]);

            // Map để loại trùng rows theo rowKey
            const rowMap = new Map<any, any>();
            [...selectedRows, ...rows].forEach(row => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
                // @ts-ignore
                const keyVal = row?.[rowKey];
                if (keyVal && newAllSelectedKeys.has(keyVal)) {
                    rowMap.set(keyVal, row);
                }
            });

            set({
                selectedRowKeys: Array.from(newAllSelectedKeys),
                selectedRows: Array.from(rowMap.values())
            });
        },
        clearSelection: () => {
            set({
                selectedRowKeys: [],
                selectedRows: []
            });
        },

        isSelected: (key) => {
            return get().selectedRowKeys.includes(key);
        },
        onChangeTableData: (rowKeys: React.Key[], rows: any[], rowKey: string) => {
            set({
                rowKey,
                currentPageKeys: rowKeys
            });
        }
    }))
);

// Improved hook factory
export function createRowSelectionHook<T>(config: RowSelectionConfig<T> = {}): () => UseRowSelectionResult<T> {
    const {
        isRowDisabled,
        maxSelection,
        onSelectionChange,
        preserveSelection = false
    } = config;

    // Create store instance per hook instance
    const store = createRowSelectionStore<T>();

    return function useRowSelection() {
        const {
            selectedRowKeys,
            selectedRows,
            setSelection,
            clearSelection,
            isSelected,
            onChangeTableData
        } = store();

        // Memoized selection handler với validation
        const handleSelectionChange = useCallback((keys: React.Key[], rows: T[]) => {
            // Validate max selection
            if (maxSelection && keys.length > maxSelection) {
                console.warn(`Maximum ${maxSelection} items can be selected`);
                return;
            }

            // Filter disabled rows
            if (isRowDisabled) {
                const validKeys: React.Key[] = [];
                const validRows: T[] = [];

                keys.forEach((key, index) => {
                    const row = rows[index];
                    if (row && !isRowDisabled(row)) {
                        validKeys.push(key);
                        validRows.push(row);
                    }
                });

                setSelection(validKeys, validRows, preserveSelection);
                onSelectionChange?.(validKeys, validRows);
            } else {
                setSelection(keys, rows, preserveSelection);
                onSelectionChange?.(keys, rows);
            }
        }, [maxSelection, isRowDisabled, setSelection, onSelectionChange]);

        // Memoized row selection config
        const rowSelection: TableRowSelection<T> = useMemo(() => ({
            selectedRowKeys,
            onChange: handleSelectionChange,
            onSelect: (record, selected, selectedRows, nativeEvent) => {
                if (isRowDisabled?.(record)) {
                    nativeEvent?.preventDefault();
                    return;
                }
            },
            getCheckboxProps: (record) => ({
                disabled: isRowDisabled?.(record) ?? false,
                name: 'row-selection'
            }),
            columnWidth: 48,
            fixed: true,
            hideSelectAll: maxSelection === 1,
            type: config.type || 'checkbox',
        }), [selectedRowKeys, handleSelectionChange, isRowDisabled, clearSelection, maxSelection]);

        const handleChangeTableData = useCallback((rowKeys: React.Key[], rows: any[], rowKey: string) => {
            onChangeTableData(rowKeys, rows, rowKey);
            if (!preserveSelection) {
                clearSelection();
            }
        }, [onChangeTableData]);
        // Extended API
        return {
            // Core functionality
            rowSelection,
            selectedRowKeys,
            selectedRows,
            clearSelection,
            onChangeTableData: handleChangeTableData,

            // Extended functionality
            isSelected,
            hasSelection: selectedRowKeys.length > 0,
            selectionCount: selectedRowKeys.length,

            // Utility methods
            selectByCondition: (rows: T[], condition: (row: T) => boolean, getKey: (row: T) => React.Key) => {
                const matchingRows = rows.filter(row =>
                    condition(row) && !isRowDisabled?.(row)
                );
                if (maxSelection && matchingRows.length > maxSelection) {
                    matchingRows.splice(maxSelection);
                }
                const keys = matchingRows.map(getKey);
                setSelection(keys, matchingRows, preserveSelection);
            }
        };
    };
}

// Cache instance theo config
const rowSelectionStoreMap = new Map<any, ReturnType<typeof createRowSelectionHook>>();

// Hàm tạo/lấy store instance (ngoài React dùng được)
export function getRowSelectionStore<T>(config: RowSelectionConfig<T> = {}) {
    if (!rowSelectionStoreMap.has(config)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
        // @ts-ignore
        rowSelectionStoreMap.set(config, createRowSelectionHook<T>(config));
    }
    return rowSelectionStoreMap.get(config)!;
}


export const useRowSelectionStore = <T extends object>(options?: RowSelectionConfig<T>) => {
    const useStore = useMemo(() => createRowSelectionHook<T>(options), []);
    return useStore();
};
