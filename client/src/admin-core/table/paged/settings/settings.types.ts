/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
// webapp/src/plugin-core/table/paged/settings/settings.types.ts
import React from 'react';
import {type ColumnType} from 'antd/es/table/interface';

/**
 * Row height, mapped 1:1 to antd Table `size`.
 * small  = "Mặc định"
 * middle = "Trung bình"
 * large  = "Cao"
 */
export type DensityLevel = 'large' | 'middle' | 'small';

/** A column may opt into being always-visible (never hideable). */
export interface SettingsColumnMeta {
    lockVisible?: boolean;
}

/** What we persist to localStorage. Only stable identifiers, never column objects. */
export interface PersistedSettings {
    density: DensityLevel;
    hiddenColumns: string[]; // column key/dataIndex values currently hidden
}

export interface UseTableSettingsParams {
    /** Columns already built via TableUtil.getColumns(). */
    columns: ColumnType<any>[];
    /** Override the storage key. If omitted, derived from window.location.pathname. */
    tableKey?: string;
    /** Default density when nothing is persisted. Defaults to 'large'. */
    defaultDensity?: DensityLevel;
    /** Persist to localStorage. Defaults to true; false = session-only state. */
    persist?: boolean;
}

export interface UseTableSettingsResult {
    /** Pass to <PagedTable size={size}/>. */
    size: DensityLevel;
    /** Columns with `hidden` applied per current visibility state. */
    processedColumns: ColumnType<any>[];
    /** Render into PageLayoutWithTable's topActionContent. */
    settingsBar: React.ReactNode;
}

/** One row in the column show/hide dropdown. */
export interface ToggleableColumn {
    id: string;
    label: React.ReactNode;
    locked: boolean;
    visible: boolean;
}

/** Props the hook hands to TableSettingsBar / the two dropdowns. */
export interface TableSettingsControls {
    density: DensityLevel;
    onDensityChange: (d: DensityLevel) => void;
    columns: ToggleableColumn[];
    onToggleColumn: (id: string, visible: boolean) => void;
    onToggleAll: (visible: boolean) => void;
}
