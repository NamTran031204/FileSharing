import dayjs, { type Dayjs } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export interface DateRangeDto {
  startDate?: Dayjs | null;
  endDate?: Dayjs | null;
}

export type DateRangePreset =
  | 'hom_nay'
  | 'hom_qua'
  | '7_ngay_truoc'
  | 'thang_nay'
  | 'thang_truoc';

/**
 * Parse a backend date value to a dayjs object.
 * Handles:
 *  - ISO-8601 string  → "2025-05-31T10:30:45.123456789Z"  (from fixed JacksonConfig)
 *  - Epoch seconds    → 1748612345.123  (legacy, before WRITE_DATES_AS_TIMESTAMPS was disabled)
 *  - Epoch ms         → 1748612345123   (standard JS timestamp)
 *  - Date object      → passed through
 */
export function parseBackendDate(value: string | number | Date | null | undefined): dayjs.Dayjs | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    // epoch seconds (< 1e11) vs epoch milliseconds
    const ms = value < 1e11 ? value * 1000 : value;
    return dayjs(ms);
  }
  return dayjs(value);
}

/**
 * Format a backend date as a relative time string.
 * Returns: "Just now" | "2h ago" | "3d ago" | locale date string
 */
export function formatRelativeTime(value: string | number | Date | null | undefined): string {
  const d = parseBackendDate(value);
  if (!d || !d.isValid()) return '';
  const diffMs = dayjs().diff(d);
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.format('DD/MM/YYYY');
}

export const getDateRange = (opt: DateRangePreset | string): DateRangeDto => {
  const now = dayjs();
  switch (opt) {
    case 'hom_nay':
      return { startDate: now.startOf('day'), endDate: now.endOf('day') };
    case 'hom_qua': {
      const yesterday = now.subtract(1, 'day');
      return { startDate: yesterday.startOf('day'), endDate: yesterday.endOf('day') };
    }
    case '7_ngay_truoc':
      return { startDate: now.subtract(6, 'day').startOf('day'), endDate: now.endOf('day') };
    case 'thang_nay':
      return { startDate: now.startOf('month'), endDate: now.endOf('day') };
    case 'thang_truoc': {
      const lastMonth = now.subtract(1, 'month');
      return { startDate: lastMonth.startOf('month'), endDate: lastMonth.endOf('month') };
    }
    default:
      return { startDate: now.startOf('day'), endDate: now.endOf('day') };
  }
};

export const disableAfter = (curr: Dayjs, anchor?: Dayjs | null): boolean => {
  if (!anchor) return false;
  return curr.isAfter(anchor, 'day');
};

export const disableAfterOrSame = (curr: Dayjs, anchor?: Dayjs | null): boolean => {
  if (!anchor) return false;
  return !curr.isBefore(anchor, 'day');
};

export const disableBefore = (curr: Dayjs, anchor?: Dayjs | null): boolean => {
  if (!anchor) return false;
  return curr.isBefore(anchor, 'day');
};

export const disableBeforeOrSame = (curr: Dayjs, anchor?: Dayjs | null): boolean => {
  if (!anchor) return false;
  return !curr.isAfter(anchor, 'day');
};

export const disableAfterAndAfterNow = (curr: Dayjs, anchor?: Dayjs | null): boolean => {
  const afterAnchor = anchor ? curr.isAfter(anchor, 'day') : false;
  return afterAnchor || curr.isAfter(dayjs(), 'day');
};

export const disableBeforeAndAfterNow = (curr: Dayjs, anchor?: Dayjs | null): boolean => {
  const beforeAnchor = anchor ? curr.isBefore(anchor, 'day') : false;
  return beforeAnchor || curr.isAfter(dayjs(), 'day');
};
