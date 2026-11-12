import {type DateRangeDto} from "@plugin-core/shared/types/common.types";
import React, {useCallback} from "react";
import {Form} from "antd";
import dayjs, {Dayjs} from 'dayjs';
import {type ICommonInputProp} from "../model/ICommonInputProp";
import {QuickDateRangePicker} from "@plugin-core/shared/date-picker";

export interface IOrdDateRangeInputProp extends Omit<ICommonInputProp<DateRangeDto>, "placeholder"> {
    /** Bind start/end to two flat form fields (preferred for search/API params). */
    startName?: string;
    endName?: string;
    placeholder?: [string, string];
    allowClear?: boolean;
    required?: boolean;
    /** Kept for API compatibility with older call sites; unused by QuickDateRangePicker UI. */
    allowEq?: boolean;
    labelMode?: 'icon' | 'fromToLabel';
    notAllowFuture?: boolean;
    onlyThreeMonths?: boolean;
}

const toDayjs = (value: unknown): Dayjs | null => (value ? dayjs(value as string | Date) : null);

/** Registers a Form.Item field without rendering a DOM control (keeps Date values intact). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
const FormValueSink = (_props: {value?: unknown; onChange?: (v: unknown) => void}) => null;

export const OrdDateRangeInput = (props: IOrdDateRangeInputProp) => {
    const {
        value,
        onChange,
        startName,
        endName,
        placeholder,
        allowClear = false,
        required,
    } = props;

    const form = Form.useFormInstance();
    const splitMode = Boolean(startName && endName);

    const watchedStart = Form.useWatch(startName ?? '', form);
    const watchedEnd = Form.useWatch(endName ?? '', form);

    const rangeValue: [Dayjs | null, Dayjs | null] = splitMode
        ? [toDayjs(watchedStart), toDayjs(watchedEnd)]
        : [toDayjs(value?.startDate), toDayjs(value?.endDate)];

    const handleChange = useCallback((range: [Dayjs, Dayjs]) => {
        const startDate = range[0].toDate();
        const endDate = range[1].toDate();
        if (splitMode && startName && endName) {
            form.setFieldsValue({
                [startName]: startDate,
                [endName]: endDate,
            });
            return;
        }
        onChange?.({...value, startDate, endDate});
    }, [splitMode, startName, endName, form, onChange, value]);

    const requiredRule = required ? [{required: true}] : undefined;

    return (
        <>
            {splitMode && startName && endName && (
                <>
                    <Form.Item name={startName} hidden rules={requiredRule}>
                        <FormValueSink/>
                    </Form.Item>
                    <Form.Item name={endName} hidden rules={requiredRule}>
                        <FormValueSink/>
                    </Form.Item>
                </>
            )}
            <QuickDateRangePicker
                value={rangeValue}
                onChange={handleChange}
                placeholder={placeholder}
                allowClear={allowClear}
            />
        </>
    );
};

export default OrdDateRangeInput;
