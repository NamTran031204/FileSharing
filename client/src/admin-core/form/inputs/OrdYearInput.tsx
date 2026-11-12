/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {DatePicker} from "antd";
import * as React from "react";
import {useEffect, useState} from "react";
import dayjs, {Dayjs} from "dayjs";
import {type IOrdDateInputProp} from "../model/DateProp";
import {DateIcon} from "@plugin-core/shared/icon/DateIcon";

const OrdYearInput = (props: IOrdDateInputProp) => {
    const [valueYear, setValueYear] = useState();
    useEffect(() => {
        if (props.value) {
            const d = `${props.value}-01-01`;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
            // @ts-ignore
            setValueYear(dayjs(d));
        } else {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
            // @ts-ignore
            setValueYear(null);
        }
    }, [props.value]);
    const onYearChange = (date: Dayjs, dateString: string | string[] | null) => {
        if (!dateString) {
            submitValue(null);
        } else {
            submitValue(dateString)
        }
    }
    const submitValue = (v: any | null) => {
        if (props.onChange) {
            props.onChange(v);
        }
    }
    return (
        <DatePicker
            style={{ width: '100%' }}
            className={props.classNames}
            suffixIcon={!props.hiddenSuffixIcon && <DateIcon />}
            picker="year"  // Chọn kiểu "year"
            placeholder={'Năm'}
            {...props}
            value={valueYear ? dayjs(`${valueYear}-01-01`) : null}  // Đảm bảo giá trị năm hợp lệ
            onChange={(date, dateString) => {
                onYearChange(date as Dayjs, dateString);
            }}
        />
    );
};

export default OrdYearInput;
