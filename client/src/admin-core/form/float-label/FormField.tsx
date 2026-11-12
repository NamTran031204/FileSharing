/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
// components/forms/FormField.tsx
import React from "react";
import {Checkbox, Form, Input} from "antd";
import {FieldLabel, FloatFieldLabel} from "./index";
import {type Rule} from "antd/es/form";

export interface FormFieldProps {
    label: React.ReactNode;
    ignoreLabel?: boolean;
    name: string;
    required?: boolean;
    children?: React.ReactNode;
    rules?: Rule[];
    disabled?: boolean;
    isCheckbox?: boolean;
    placeholder?: string;
    valuePropName?: string;
    maxLength?: number | undefined;
    initialValue?: any;

}

export const OrdFormField = ({
                                 label,
                                 ignoreLabel = false,
                                 name,
                                 required,
                                 rules = [],
                                 children,
                                 disabled,
                                 isCheckbox,
                                 placeholder,
                                 valuePropName,
                                 maxLength,
                                 initialValue
                             }: FormFieldProps) => {
    if (isCheckbox) {
        return (
            <Form.Item name={name} valuePropName={valuePropName || "checked"} initialValue={initialValue}>
                {children || <Checkbox disabled={disabled}><FieldLabel label={'check_box.' + label}/></Checkbox>}
            </Form.Item>
        );
    }

    return (
        <FloatFieldLabel label={label} required={required} ignoreLabel={ignoreLabel}>
            <Form.Item name={name} rules={rules} initialValue={initialValue}>
                {children || <Input disabled={disabled} placeholder={placeholder} maxLength={maxLength}/>}
            </Form.Item>
        </FloatFieldLabel>
    );
};
