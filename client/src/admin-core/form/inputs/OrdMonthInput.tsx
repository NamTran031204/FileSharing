import {DatePicker, type DatePickerProps} from "antd";
import * as React from "react";
import {useEffect, useState} from "react";
import dayjs, {type Dayjs} from "dayjs";
import {type IOrdDateInputProp} from "../model/DateProp";
import {DateIcon} from "@plugin-core/shared/icon/DateIcon";

const OrdMonthInput = (props: IOrdDateInputProp) => {
    const [valueDayjs, setValueDayjs] = useState<dayjs.Dayjs | null>(null);
    useEffect(() => {
        if (props.value) {
            setValueDayjs(dayjs(props.value));
        } else {
            setValueDayjs(null);
        }
    }, [props.value]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const onChange: DatePickerProps['onChange'] = (date, dateString) => {
        // setValueDayjs(date);
        props.onChange?.((date as Dayjs | undefined)?.toDate() ?? null);
    };

    return (
        <DatePicker
            style={{ width: '100%' }}
            className={props.classNames}
            suffixIcon={!props.hiddenSuffixIcon && <DateIcon />}
            picker="month"
            placeholder={'MM/YYYY'}
            {...props}
            value={valueDayjs}
            onChange={onChange}
        />
    );
};

export default OrdMonthInput;
