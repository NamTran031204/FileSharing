/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {Dayjs} from "dayjs";
import {type ICommonInputProp} from "./ICommonInputProp";
import type {DisabledDate, FormatType} from "@rc-component/picker/lib/interface";
import type {Variant} from "antd/es/config-provider";

export interface IOrdDateInputProp extends ICommonInputProp<string | Date | null | any> {
    defaultValue?: Dayjs | null;
    onChange?: (date: Date | null) => void;
    onOk?: (date: Dayjs | undefined) => void;
    disabledDate?: DisabledDate<Dayjs>;
    disabledTime?: (date: Dayjs | null) => {
        disabledHours?: () => number[];
        disabledMinutes?: (hour: number) => number[];
        disabledSeconds?: (hour: number, minute: number) => number[];
    };
    showTime?: boolean
    format?: FormatType<any | Date> | FormatType<any | Date>[] | {
        format: string;
        type?: 'mask';
    };
    hiddenSuffixIcon?: boolean | undefined;
    classNames?: any;
    allowClear?: boolean;
    autoFocus?: boolean;
    variant?: Variant;
    rootClassName?: string;
}
