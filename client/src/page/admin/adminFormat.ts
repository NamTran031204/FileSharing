import dayjs from 'dayjs';

// Tien ich dinh dang dung chung cho cac trang admin (so lieu tu API co the la string do kieu long)
export const formatBytes = (v?: string | number | null): string => {
    if (v === undefined || v === null || v === '') return '—';
    let n = Number(v);
    if (!Number.isFinite(n)) return '—';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (n >= 1024 && i < units.length - 1) {
        n /= 1024;
        i++;
    }
    return `${i === 0 ? n : n.toFixed(1)} ${units[i]}`;
};

export const formatDateTime = (v?: string | Date | null): string =>
    v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '—';

/** CPU tra ve dang ty le 0..1; null/undefined hien dau gach */
export const formatPercent = (v?: number | null): string =>
    v === undefined || v === null ? '—' : `${Math.round(v * 100)}%`;

export const formatUptime = (v?: string | Date | null): string => {
    if (!v) return '—';
    const m = Math.max(0, Math.floor((Date.now() - new Date(v).getTime()) / 60000));
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
};
