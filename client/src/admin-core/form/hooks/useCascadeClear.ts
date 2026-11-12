import {useCallback} from 'react';
import {Form} from 'antd';
import type {FormInstance} from "antd/es/form/hooks/useForm";

/**
 * useCascadeClear — clear child field(s) khi parent field đổi value.
 *
 * Dùng cho cascade select (province → ward, ...).
 * Trả về handler gắn vào `componentProps.onChange` của parent select.
 *
 * @param childFields Danh sách tên field con cần clear khi parent đổi.
 * @returns onChange handler `(value) => void`.
 */
export const useCascadeClear = (childFields: string[]) => {
    const form = Form.useFormInstance();
    return useCascadeClearFormInstance(form, childFields);
};

export const useCascadeClearFormInstance = (form: FormInstance, childFields: string[]) => {
    return useCallback(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
        (_value: unknown) => {
            if (!form) return;
            childFields.forEach((name) => {
                form.setFieldValue(name, undefined);
            });
        },
        [form, childFields],
    );
};
