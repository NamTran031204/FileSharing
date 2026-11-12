/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
// webapp/src/plugin-core/table/paged/settings/settings.storage.ts
import {type PersistedSettings} from './settings.types';

const KEY_PREFIX = 'ord-table-settings::';

/** Turn a pathname into a stable slug: '/admin/master-data/ward' -> 'admin-master-data-ward'. */
export const slugifyPath = (pathname: string): string => {
    return pathname
        .replace(/^\/+|\/+$/g, '')   // trim leading/trailing slashes
        .replace(/\//g, '-')          // slashes -> dashes
        .replace(/[^a-zA-Z0-9_-]/g, '') // drop anything unexpected
        || 'root';
};

/** Full localStorage key. Explicit tableKey wins; otherwise derive from pathname. */
export const buildStorageKey = (tableKey?: string): string => {
    const base = tableKey && tableKey.trim().length > 0
        ? tableKey.trim()
        : slugifyPath(window.location.pathname);
    return KEY_PREFIX + base;
};

/** Read + validate persisted settings. Returns null on missing/corrupt data. */
export const loadSettings = (key: string): PersistedSettings | null => {
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (
            parsed &&
            (parsed.density === 'large' || parsed.density === 'middle' || parsed.density === 'small') &&
            Array.isArray(parsed.hiddenColumns)
        ) {
            return {
                density: parsed.density,
                hiddenColumns: parsed.hiddenColumns.filter((x: any) => typeof x === 'string'),
            };
        }
        return null;
    } catch {
        return null;
    }
};

/** Write settings. Silently ignores quota/serialization errors. */
export const saveSettings = (key: string, value: PersistedSettings): void => {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // ignore — persistence is best-effort
    }
};