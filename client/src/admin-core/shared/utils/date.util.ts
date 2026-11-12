import dayjs, {Dayjs} from 'dayjs';
import {type RangePickerProps} from "antd/es/date-picker";
import {
    endOfMonth,
    endOfQuarter,
    endOfToday,
    endOfYear,
    endOfYesterday,
    format,
    parse,
    startOfMonth,
    startOfQuarter,
    startOfToday,
    startOfYear,
    startOfYesterday,
    subDays,
    subMonths,
    subYears
} from "date-fns";
import relativeTime from 'dayjs/plugin/relativeTime'

export type DateRangeInitOption = "hom_nay"
    | "hom_qua" | "7_ngay_truoc" | "30_ngay_truoc" | "thang_nay" | "thang_truoc" | "nam_nay" | "nam_truoc"
    | "quy_1_nam_nay" | "quy_2_nam_nay" | "quy_3_nam_nay" | "quy_4_nam_nay"
    | "quy_1_nam_truoc" | "quy_2_nam_truoc" | "quy_3_nam_truoc" | "quy_4_nam_truoc" | string;

class DateUtil {
    disableAfter(current: Dayjs | null, endDate: Dayjs | null) {
        if (!current || !endDate) {
            return false;
        }
        return current.isAfter(endDate, 'day');
    }

    disableAfterOrSame(current: Dayjs | null, endDate: Dayjs | null) {
        if (!current || !endDate) {
            return false;
        }
        return current.isAfter(endDate, 'day') || current.isSame(endDate, 'day');
    }

    disableBefore(current: Dayjs | null, startDate: Dayjs | null) {
        if (!current || !startDate) {
            return false;
        }
        return current.isBefore(startDate, 'day');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    disableBeforeOrSame(current: Dayjs | null, startDate: Dayjs | null, isDisableEq = false) {
        if (!current || !startDate) {
            return false;
        }
        return current.isBefore(startDate, 'day') || current.isSame(startDate, 'day');
    }

    disableAfterAndAfterNow(current: Dayjs | null, endDate: Dayjs | null) {
        if (!current) {
            return false;
        }
        return current.isAfter(endDate, 'day') || current.isAfter(new Date(), 'day');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    disableBeforeAndAfterNow(current: Dayjs | null, startDate: Dayjs | null, isDisableEq = false) {
        if (!current) {
            return false;
        }
        return current.isBefore(startDate, 'day') || current.isAfter(new Date(), 'day');
    }

    disableBeforeNow: RangePickerProps['disabledDate'] = (current) => {
        return this.disableBefore(current, dayjs());
    };
    disableBeforeOrSameNow: RangePickerProps['disabledDate'] = (current) => {
        return this.disableBeforeOrSame(current, dayjs());
    };
    disableAfterNow: RangePickerProps['disabledDate'] = (current) => {
        return this.disableAfter(current, dayjs());
    };
    disableAfterOrSameNow: RangePickerProps['disabledDate'] = (current) => {
        return this.disableAfterOrSame(current, dayjs());
    };

    toFormat(isoString: string | Date | undefined, format: string = 'DD/MM/YYYY HH:mm'): string {
        if (isoString === undefined) {
            return "-";
        }
        return dayjs(isoString).format(format)
    }

    fromNow(isoString: string | Date | undefined): string {
        if (isoString === undefined) {
            return "-";
        }
        dayjs.extend(relativeTime)
        return dayjs(isoString).fromNow();
    }

    showWithFormat(value: Date | null | undefined, formatStr: string = 'dd/MM/yyyy') {
        if (!value) {
            return null;
        }
        return format(value, formatStr);
    }

    getDateRange(option: DateRangeInitOption) {
        let startDate, endDate;

        switch (option) {
            case 'hom_nay':
                startDate = startOfToday();
                endDate = endOfToday();
                break;
            case 'hom_qua':
                startDate = startOfYesterday();
                endDate = endOfYesterday();
                break;
            case '7_ngay_truoc':
                startDate = subDays(startOfToday(), 6);
                endDate = endOfToday();
                break;
            case '30_ngay_truoc':
                startDate = subDays(startOfToday(), 29);
                endDate = endOfToday();
                break;
            case 'thang_nay':
                startDate = startOfMonth(new Date());
                endDate = endOfMonth(new Date());
                break;
            case 'thang_truoc':
                startDate = startOfMonth(subMonths(new Date(), 1));
                endDate = endOfMonth(subMonths(new Date(), 1));
                break;
            case 'nam_nay':
                startDate = startOfYear(new Date());
                endDate = endOfToday();
                break;
            case 'nam_truoc':
                startDate = startOfYear(subYears(new Date(), 1));
                endDate = endOfYear(subYears(new Date(), 1));
                break;
            case 'quy_1_nam_nay':
                startDate = startOfQuarter(new Date(new Date().getFullYear(), 0, 1));
                endDate = endOfQuarter(new Date(new Date().getFullYear(), 2, 31));
                break;
            case 'quy_2_nam_nay':
                startDate = startOfQuarter(new Date(new Date().getFullYear(), 3, 1));
                endDate = endOfQuarter(new Date(new Date().getFullYear(), 5, 30));
                break;
            case 'quy_3_nam_nay':
                startDate = startOfQuarter(new Date(new Date().getFullYear(), 6, 1));
                endDate = endOfQuarter(new Date(new Date().getFullYear(), 8, 30));
                break;
            case 'quy_4_nam_nay':
                startDate = startOfQuarter(new Date(new Date().getFullYear(), 9, 1));
                endDate = endOfQuarter(new Date(new Date().getFullYear(), 11, 31));
                break;
            case 'quy_1_nam_truoc':
                startDate = startOfQuarter(new Date(new Date().getFullYear() - 1, 0, 1));
                endDate = endOfQuarter(new Date(new Date().getFullYear() - 1, 2, 31));
                break;
            case 'quy_2_nam_truoc':
                startDate = startOfQuarter(new Date(new Date().getFullYear() - 1, 3, 1));
                endDate = endOfQuarter(new Date(new Date().getFullYear() - 1, 5, 30));
                break;
            case 'quy_3_nam_truoc':
                startDate = startOfQuarter(new Date(new Date().getFullYear() - 1, 6, 1));
                endDate = endOfQuarter(new Date(new Date().getFullYear() - 1, 8, 30));
                break;
            case 'quy_4_nam_truoc':
                startDate = startOfQuarter(new Date(new Date().getFullYear() - 1, 9, 1));
                endDate = endOfQuarter(new Date(new Date().getFullYear() - 1, 11, 31));
                break;
            default:
                startDate = null;
                endDate = null;
        }

        return {startDate, endDate};
    }

    getNow() {
        const today = new Date();
        const userTimezoneOffset = today.getTimezoneOffset() * 60000;
        return new Date(today.getTime() - userTimezoneOffset);
    }

    createDateWithTime = (timeString: string | null | undefined) => {
        if (timeString) {
            const [hours, minutes] = timeString.split(':').map(Number);
            return dayjs().hour(hours).minute(minutes).second(0);
        }
        return dayjs();

    };

    convertString(dateString?: string, formatString = 'dd/MM/yyyy') {
        if (!dateString) {
            return null;
        }
        return parse(dateString, formatString, new Date());
    }

    convertExcelValue(cellValue?: string) {
        if (!cellValue) {
            return null;
        }
        const dateStr = '' + cellValue;
        if (dateStr.indexOf('/') > -1) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
            // @ts-ignore
            return this.convertString(cellValue, 'dd/MM/yyyy');
        }
        if (dateStr.indexOf('-') > -1) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
            // @ts-ignore
            return this.convertString(cellValue, 'dd-MM-yyyy');
        }
        return null;
    }

    getToDayString() {
        const today = new Date();
        return this.showWithFormat(today);
    }
}

export default new DateUtil();
