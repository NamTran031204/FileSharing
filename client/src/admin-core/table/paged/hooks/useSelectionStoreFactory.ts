/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {create} from 'zustand';
import {subscribeWithSelector} from 'zustand/middleware';
import React, {useMemo} from 'react';
import {type TableRowSelection} from 'antd/es/table/interface';
import {type UseBoundStore} from 'zustand/react';
import {type StoreApi} from 'zustand/vanilla';

// ─── Config ─────────────────────────────────────────────────────────────────

export interface SelectionStoreConfig<T = any> {
    /** Giữ lại các dòng đã chọn khi chuyển trang hoặc reload table */
    preserveSelection?: boolean;
    /** Giới hạn số dòng tối đa được chọn */
    maxSelection?: number;
    /** Loại selection column */
    type?: 'checkbox' | 'radio';
    /** Disable row theo điều kiện */
    isRowDisabled?: (record: T) => boolean;
    /** Callback khi selection thay đổi */
    onSelectionChange?: (keys: React.Key[], rows: T[]) => void;
}

// ─── State ───────────────────────────────────────────────────────────────────

export interface SelectionStoredState<T = any> {
    selectedRowKeys: React.Key[];
    selectedRows: T[];
    /** Keys của trang hiện tại — dùng để tính diff khi preserveSelection=true */
    currentPageKeys: React.Key[];
    rowKey: string;

    // ── Public API ──────────────────────────────────────────────────────────

    /** Xoá toàn bộ selection */
    clearSelection: () => void;
    /** Chọn cụ thể một danh sách rows */
    selectRows: (rows: T[], getKey: (row: T) => React.Key) => void;
    /** Kiểm tra một key có đang được chọn không */
    isSelected: (key: React.Key) => boolean;

    // ── Internal — dùng bởi PagedTable ──────────────────────────────────────

    /** Gọi khi người dùng thay đổi selection trên UI */
    _onChange: (keys: React.Key[], rows: T[]) => void;
    /** Gọi khi dữ liệu trang thay đổi (phân trang / reload) */
    _notifyPageDataChanged: (pageKeys: React.Key[], rowKey: string) => void;
    /** Trả về props cho từng row checkbox (dùng trong rowSelection config) */
    _getCheckboxProps: (record: T) => {disabled: boolean};
    /** Loại selection: 'checkbox' | 'radio' */
    _type: 'checkbox' | 'radio';
    /** Ẩn checkbox "Select All" khi maxSelection === 1 */
    _hideSelectAll: boolean;
}

export type SelectionStore<T = any> = UseBoundStore<StoreApi<SelectionStoredState<T>>>;

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Tạo một Zustand selection store độc lập.
 *
 * @example
 * // Khai báo ở module scope (ngoài component) để store tồn tại xuyên suốt
 * const mySelectionStore = createSelectionStore<MyRow>({ preserveSelection: true });
 *
 * // Dùng trong component
 * const { selectedRows, clearSelection } = mySelectionStore();
 *
 * // Truyền vào PagedTable / SearchablePagedTable
 * <PagedTable tableStore={tableStore} selectionStore={mySelectionStore} columns={columns} rowKey="id" />
 */
export function createSelectionStore<T = any>(config: SelectionStoreConfig<T> = {}): SelectionStore<T> {
    const {
        preserveSelection = false,
        maxSelection,
        isRowDisabled,
        onSelectionChange,
        type = 'checkbox',
    } = config;

    return create<SelectionStoredState<T>>()(
        subscribeWithSelector((set, get) => ({
            selectedRowKeys: [],
            selectedRows: [],
            currentPageKeys: [],
            rowKey: 'id',

            // ── Internal helpers ───────────────────────────────────────────────

            _type: type,
            _hideSelectAll: maxSelection === 1,
            _getCheckboxProps: (record: T) => ({
                disabled: isRowDisabled?.(record) ?? false,
            }),

            _onChange: (keys, rows) => {
                // Giới hạn số lượng
                if (maxSelection != null && keys.length > maxSelection) {
                    console.warn(`[SelectionStore] Tối đa ${maxSelection} dòng được chọn`);
                    return;
                }

                // Lọc disabled rows
                let finalKeys = keys;
                let finalRows = rows;
                if (isRowDisabled) {
                    const valid = keys
                        .map((k, i) => ({k, r: rows[i]}))
                        .filter(({r}) => r != null && !isRowDisabled(r));
                    finalKeys = valid.map(p => p.k);
                    finalRows = valid.map(p => p.r);
                }

                if (!preserveSelection) {
                    set({selectedRowKeys: finalKeys, selectedRows: finalRows});
                    onSelectionChange?.(finalKeys, finalRows);
                    return;
                }

                // preserveSelection: giữ rows từ các trang khác
                const {currentPageKeys, selectedRows: prevRows, selectedRowKeys: prevKeys, rowKey} = get();
                const otherPageKeys = prevKeys.filter(k => !currentPageKeys.includes(k));
                const mergedKeys = Array.from(new Set([...otherPageKeys, ...finalKeys]));

                // Hợp nhất rows, loại trùng theo rowKey
                const rowMap = new Map<React.Key, T>();
                [...prevRows, ...finalRows].forEach(row => {
                    const k = (row as any)[rowKey];
                    if (k != null && mergedKeys.includes(k)) rowMap.set(k, row);
                });

                const mergedRows = Array.from(rowMap.values());
                set({selectedRowKeys: mergedKeys, selectedRows: mergedRows});
                onSelectionChange?.(mergedKeys, mergedRows);
            },

            _notifyPageDataChanged: (pageKeys, rowKey) => {
                set({currentPageKeys: pageKeys, rowKey});
                if (!preserveSelection) {
                    // Xoá selection khi chuyển trang (nếu không preserve)
                    set({selectedRowKeys: [], selectedRows: []});
                }
            },

            // ── Public API ─────────────────────────────────────────────────────

            clearSelection: () => set({selectedRowKeys: [], selectedRows: []}),

            selectRows: (rows, getKey) => {
                const valid = isRowDisabled ? rows.filter(r => !isRowDisabled(r)) : rows;
                const final = maxSelection != null ? valid.slice(0, maxSelection) : valid;
                const finalKeys = final.map(getKey);
                set({selectedRowKeys: finalKeys, selectedRows: final});
                onSelectionChange?.(finalKeys, final);
            },

            isSelected: (key) => get().selectedRowKeys.includes(key),
        }))
    );
}

// ─── Internal hook dùng trong PagedTable ─────────────────────────────────────

/**
 * Hook nội bộ — luôn được gọi (tuân thủ React rules), trả về `undefined` khi
 * không có store để Ant Design Table không render cột selection.
 */
export function useTableRowSelectionConfig<T>(
    store: SelectionStore<T> | undefined
): TableRowSelection<T> | undefined {
    // Fallback store đảm bảo hook luôn gọi cùng số lượng (React rules)
    const fallback = useMemo(() => createSelectionStore<T>(), []);
    const active = (store ?? fallback) as SelectionStore<T>;

    const selectedRowKeys = active(s => s.selectedRowKeys);
    const _onChange = active(s => s._onChange);
    const _getCheckboxProps = active(s => s._getCheckboxProps);
    const _type = active(s => s._type);
    const _hideSelectAll = active(s => s._hideSelectAll);

    // Trả undefined nếu không có store → Table không render cột selection
    if (!store) return undefined;

    return {
        type: _type,
        selectedRowKeys,
        onChange: _onChange as any,
        getCheckboxProps: _getCheckboxProps,
        columnWidth: 48,
        fixed: true as const,
        hideSelectAll: _hideSelectAll,
    } as TableRowSelection<T>;
}
