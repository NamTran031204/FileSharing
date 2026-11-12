/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {type CheckboxProps, type ColProps, type FormItemProps, type InputProps} from 'antd';
import {type Rule} from 'antd/es/form';
import React from 'react';
import {type IOrdSelectProp} from "../select/OrdSelect";
import {type IOrdDateInputProp} from "../model/DateProp";
import {type TextAreaProps} from "antd/es/input";
import {type IOrdDateRangeInputProp} from "../inputs/OrdDateRangeInput";
import {type ISearchFilterTextProps} from "../search/SearchFilterText";
import {type IOrdInputRegexTextProp} from "../inputs/OrdInputRegexText";
import type {InputNumberProps} from "@rc-component/input-number/lib/InputNumber";

export type FormFieldType =
    | 'input'
    | 'input-regex'
    | 'textarea'
    | 'search-input'
    | 'number'
    | 'password'
    | 'select'
    | 'checkbox'
    | 'date'
    | 'date-range'
    | 'dateTime'
    | 'time'
    | 'switch'
    | 'radio'
    | 'custom-field-content'
    | 'custom'
    | 'blank';

export interface BaseFormFieldConfig<IComponentProps = any> {
    name: string;
    type?: FormFieldType;
    label?: React.ReactNode;
    ignoreLabel?: boolean;
    required?: boolean;
    rules?: Rule[];
    span?: number; // Col span
    colProps?: ColProps;
    formItemProps?: Omit<FormItemProps, 'name' | 'label' | 'rules'>;
    hidden?: boolean;
    disabled?: boolean;
    initialValue?: any;
    autoFocus?: boolean;
    componentProps?: IComponentProps;
}

export interface InputFieldConfig extends BaseFormFieldConfig<InputProps> {
    maxLength: number;
}

export interface InputRegexFieldConfig extends BaseFormFieldConfig<IOrdInputRegexTextProp> {
    maxLength: number;
}

export interface TextareaFieldConfig extends BaseFormFieldConfig<TextAreaProps> {
    maxLength: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
export interface NumberFieldConfig extends BaseFormFieldConfig<InputNumberProps> {

}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
export interface SelectFieldConfig extends BaseFormFieldConfig<IOrdSelectProp> {
}

export interface CheckboxFieldConfig extends BaseFormFieldConfig<CheckboxProps> {
    checkboxText?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
export interface DateFieldConfig extends BaseFormFieldConfig<IOrdDateInputProp> {
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
export interface DateTimeFieldConfig extends BaseFormFieldConfig<IOrdDateInputProp> {
}

export interface DateRangeFieldConfig extends Omit<BaseFormFieldConfig<IOrdDateRangeInputProp>, 'name'> {
    /** Single nested DateRangeDto field name. Optional when `names` is set. */
    name?: string;
    /** Bind start/end to two flat form fields (search filters → API params). */
    names?: [string, string];
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
export interface SearchInputFieldConfig extends Partial<BaseFormFieldConfig<ISearchFilterTextProps>> {
}

export interface CustomContentFieldConfig extends BaseFormFieldConfig {
    content: React.ReactNode;
}

export interface CustomFieldConfig {
    render: () => React.ReactNode;
    span?: number;
}

export type FormFieldConfig = BaseFormFieldConfig;

export interface FormBuilderConfig {
    fields: BaseFormFieldConfig[];
}
