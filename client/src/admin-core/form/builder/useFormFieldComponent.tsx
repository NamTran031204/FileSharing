import React from 'react';
import {Checkbox, Input, InputNumber} from 'antd';
import {type FormFieldConfig, type FormFieldType, type InputFieldConfig} from './types';
import OrdSelect from "../select/OrdSelect";
import OrdDateInput from "../inputs/OrdDateInput";
import OrdDateRangeInput from "../inputs/OrdDateRangeInput";
import {SearchFilterText} from "../search/SearchFilterText";
import useAutoFocus from "../hooks/useAutoFocus";
import OrdInputRegexText from "../inputs/OrdInputRegexText";
import {FieldLabel} from "../float-label/index";
import OrdDateTimeInput from "../inputs/OrdDateTimeInput";

const {TextArea} = Input;

export const useFormFieldComponent = (
    field: FormFieldConfig
): React.ReactNode => {
    const {
        type,
        disabled,
        autoFocus,
        componentProps
    } = field;
    const focusRef = useAutoFocus();
    const baseProps = {
        ...componentProps,
        disabled,
        ref: autoFocus ? focusRef : undefined,
        autoFocus
    };

    if (!type) {
        return null;
    }
    const renderInput = () => {
        const inputOptions = field as InputFieldConfig;
        const inputTextProps = {
            ...baseProps,
            maxLength: inputOptions.maxLength
        };
        switch (type) {
            case 'textarea':
                return <TextArea autoSize={{minRows: 2, maxRows: 5}} {...inputTextProps} />;
            case 'password':
                return <Input.Password {...inputTextProps} />;
            default:
                return <Input {...inputTextProps} />;
        }
    };

    const map: Record<FormFieldType, React.ReactNode> = {
        input: renderInput(),
        textarea: renderInput(),
        password: renderInput(),
        'input-regex': <OrdInputRegexText {...baseProps} />,
        select: <OrdSelect {...baseProps} />,
        date: <OrdDateInput {...baseProps} />,
        dateTime: <OrdDateTimeInput {...baseProps}/>,
        'date-range': <OrdDateRangeInput {...baseProps} />,
        'search-input': <SearchFilterText {...baseProps}/>,
        number: <InputNumber {...baseProps} className={'w-full'}/>,
        checkbox: <Checkbox {...baseProps} ><FieldLabel label={'check_box.'}/></Checkbox>,
        time: undefined,
        switch: undefined,
        radio: undefined,
        custom: undefined,
        blank: undefined,
        'custom-field-content': undefined
    };
    return map[type] ?? null;
};
