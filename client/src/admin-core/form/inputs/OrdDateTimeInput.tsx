import {DatePicker} from "antd";
import * as React from "react";
import {useEffect, useState} from "react";
import dayjs, {Dayjs} from "dayjs";
import {type IOrdDateInputProp} from "../model/DateProp";
import {DateIcon} from "@plugin-core/shared/icon/DateIcon";


const OrdDateTimeInput = (props: IOrdDateInputProp) => {
    const [valueDayjs, setValueDayjs] = useState();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const {disabledDate, disabledTime, ...rest} = props;
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    // @ts-ignore
    return (<DatePicker style={{width: '100%'}} suffixIcon={<DateIcon/>}
                        format={{
                            format: 'DD/MM/YYYY HH:mm',
                            type: 'mask',
                        }}
                        disabledDate={props.disabledDate}
                        disabledTime={props.disabledTime}
                        {...rest}
                        showTime={true}
                        onChange={(date, dateString) => onDateChange(date as Dayjs, dateString)}
                        value={valueDayjs}/>);
}
export default OrdDateTimeInput;
