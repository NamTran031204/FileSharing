import {DatePicker} from "antd";
import * as React from "react";
import {useEffect, useState} from "react";
import dayjs, {Dayjs} from "dayjs";
import {type IOrdDateInputProp} from "../model/DateProp";
import {IconsaxCalendar} from "@plugin-core/shared/icon/IconsaxIcons";


const OrdDateInput = (props: IOrdDateInputProp) => {
    const [valueDayjs, setValueDayjs] = useState();
    useEffect(() => {
        if (props.value) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
            // @ts-ignore
            setValueDayjs(dayjs(props.value));
        } else {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
            // @ts-ignore
            setValueDayjs(null);
        }
    }, [props.value]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const onDateChange = (date: Dayjs, dateString: string | string[] | null) => {
        if (!date) {
            submitValue(null);
        } else {
            const p_date = date.toDate();
            // const userTimezoneOffset = p_date.getTimezoneOffset() * 60000;
            submitValue(p_date)
        }
    }
    const submitValue = (v: Date | null) => {
        if (props.onChange) {
            props.onChange(v);
        }
    }
    return (<DatePicker style={{width: '100%'}}
                        className={props.classNames}
                        suffixIcon={!props.hiddenSuffixIcon && <IconsaxCalendar style={{fontSize: 20}}/>}
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        placeholder={'Ngày/Tháng/Năm'}
                        {...props}
                        value={valueDayjs}
                        onChange={(date, dateString) => {
                            onDateChange(date as Dayjs, dateString);
                        }}/>);
}
export default OrdDateInput;
