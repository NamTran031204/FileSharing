import dayjs, { type Dayjs } from 'dayjs';

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
