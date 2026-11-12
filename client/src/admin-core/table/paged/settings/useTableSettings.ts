/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
// webapp/src/plugin-core/table/paged/settings/useTableSettings.ts
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {type ColumnType} from 'antd/es/table/interface';
import {
    type DensityLevel,
    type SettingsColumnMeta,
    type TableSettingsControls,
    type ToggleableColumn,
    type UseTableSettingsParams,
    type UseTableSettingsResult,
} from './settings.types';
import {buildStorageKey, loadSettings, saveSettings} from './settings.storage';
import {TableSettingsBar} from './TableSettingsBar';

/** Stable identity for a column, used for persistence + visibility tracking. */
export const getColumnId = (col: ColumnType<any>): string | undefined => {
    const raw = (col.key ?? (col as any).dataIndex);
    return raw === undefined || raw === null ? undefined : String(raw);
};

/** A column that must always stay visible. */
export const isLockedColumn = (col: ColumnType<any>): boolean => {
    const id = getColumnId(col);
    if (id === 'rowIndex') return true;
    if (col.fixed === 'right') return true;
    if ((col as SettingsColumnMeta).lockVisible) return true;
    return false;
};

/** Columns marked `hidden: true` become the default when nothing is persisted. */
export const getDefaultHiddenIds = (columns: ColumnType<any>[]): Set<string> => {
    const ids = new Set<string>();
    columns.forEach((col) => {
        if (!col.hidden) return;
        const id = getColumnId(col);
        if (id !== undefined && !isLockedColumn(col)) ids.add(id);
    });
    return ids;
};

export const useTableSettings = (params: UseTableSettingsParams): UseTableSettingsResult => {
    const {
        columns,
        tableKey,
        defaultDensity = 'middle',
        persist = true,
    } = params;

    const storageKey = useMemo(() => buildStorageKey(tableKey), [tableKey]);

    // --- initialise state from localStorage ---
    const [density, setDensity] = useState<DensityLevel>(() => {
        if (!persist) return defaultDensity;
        const saved = loadSettings(storageKey);
        return saved?.density ?? defaultDensity;
    });

    const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => {
        const defaults = getDefaultHiddenIds(columns);
        if (!persist) return defaults;
        const saved = loadSettings(storageKey);
        return saved ? new Set(saved.hiddenColumns) : defaults;
    });

    // --- persist on every change ---
    useEffect(() => {
        if (!persist) return;
        saveSettings(storageKey, {density, hiddenColumns: Array.from(hiddenIds)});
    }, [persist, storageKey, density, hiddenIds]);

    // --- toggle list shown in column dropdown (only columns with an identity) ---
    const toggleColumns = useMemo<ToggleableColumn[]>(() => {
        return columns
            .map((col) => {
                const id = getColumnId(col);
                if (id === undefined) return null;
                const locked = isLockedColumn(col);
                return {
                    id,
                    label: col.title as React.ReactNode,
                    locked,
                    visible: locked ? true : !hiddenIds.has(id),
                } as ToggleableColumn;
            })
            .filter((x): x is ToggleableColumn => x !== null);
    }, [columns, hiddenIds]);

    // --- Apply `hidden` to actual antd columns ---
    const processedColumns = useMemo<ColumnType<any>[]>(() => {
        return columns.map((col) => {
            const id = getColumnId(col);
            if (id === undefined || isLockedColumn(col)) return col;
            return {...col, hidden: hiddenIds.has(id)};
        });
    }, [columns, hiddenIds]);

    const onToggleColumn = useCallback((id: string, visible: boolean) => {
        setHiddenIds((prev) => {
            const next = new Set(prev);
            if (visible) next.delete(id); else next.add(id);
            return next;
        });
    }, []);

    const onToggleAll = useCallback((visible: boolean) => {
        setHiddenIds(() => {
            if (visible) return new Set();
            // hide everything not locked
            const next = new Set<string>();
            columns.forEach((col) => {
                const id = getColumnId(col);
                if (id !== undefined && !isLockedColumn(col)) next.add(id);
            });
            return next;
        });
    }, [columns]);

    const controls: TableSettingsControls = {
        density,
        onDensityChange: setDensity,
        columns: toggleColumns,
        onToggleColumn,
        onToggleAll,
    };

    return {
        size: density,
        processedColumns,
        settingsBar: React.createElement(TableSettingsBar, {controls}),
    };
};
