/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {TimePicker} from "antd";
import * as React from "react";
import {useEffect, useState} from "react";
import dayjs, {Dayjs} from "dayjs";
import {DateIcon} from "@plugin-core/shared/icon/DateIcon";
import DateUtil from "@plugin-core/shared/utils/date.util";
import Utils from "@plugin-core/shared/utils/utils";


const OrdTimeInput = (props: {
    value?:string
    hiddenSuffixIcon?: boolean | undefined;
    classNames?: any;
    disable?:boolean
    format?:string;
    defaultValue?:string
    allowClear?: boolean;
    onChange?: (time: string | null) => void;
    disabledTime?: (current: Dayjs | null) => {
        disabledHours?: () => number[];
        disabledMinutes?: (selectedHour: number) => number[];
        disabledSeconds?: (selectedHour: number, selectedMinute: number) => number[];
    };
} ) => {
    const [valueTimejs, setValueTimejs] = useState();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const now = dayjs()


    useEffect(() => {
        if (props.value) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
            // @ts-ignore
            setValueTimejs(DateUtil.createDateWithTime(props.value));
            return;
        } else
            if(props.defaultValue){
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
            // @ts-ignore
            setValueTimejs(DateUtil.createDateWithTime(props.defaultValue));
            return;
        }
        else {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
            // @ts-ignore
            setValueTimejs(null);

        }
    }, [props.value]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const format = "HH:mm"

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const onDateChange = (date: Dayjs, dateString: string | string[] | null) => {
        if (!date) {
            submitValue(null);
        } else {

            const p_date = date.toDate();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
            const userTimezoneOffset = p_date.getTimezoneOffset() * 60000;
            submitValue(p_date)
        }
    }
    const submitValue = (v: Date | null) => {
        if (props.onChange) {
            props.onChange(v?`${ Utils.pad2Number(v.getHours())}:${Utils.pad2Number(v.getMinutes())}`:null);
        }
    }
    return (<TimePicker style={{width: '100%'}}
                        className={props.classNames}
                        suffixIcon={!props.hiddenSuffixIcon && <DateIcon/>}
                        format={{
                            format: "HH:mm",
                            type: 'mask',
                        }}
                        placeholder={'HH:mm'}
                        {...props}
                        value={valueTimejs}
                        disabled={props.disable}
                        defaultValue={valueTimejs}
                        disabledTime={props.disabledTime}
                        onChange={(date, dateString) => {
                            onDateChange(date as Dayjs, dateString);
                        }}/>);
}
export default OrdTimeInput;
