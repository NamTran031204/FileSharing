/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import React, {useEffect, useState} from 'react';
import type {FormInstance, ModalProps} from 'antd';
import {Form, Modal} from 'antd';
import {FooterCrudModal} from '@plugin-core/modal/footer/FooterCrudModal';
import uiUtils from "@plugin-core/shared/utils/ui.utils";
import {useHotkeys} from "react-hotkeys-hook";
import {useTranslation} from "react-i18next";
import {type UseBoundStore} from "zustand/react";
import {type StoreApi} from "zustand/vanilla";
import {type ModalFormState} from "../hooks/useModalStoreFactory";

export interface Props<T = any>
    extends Omit<ModalProps, 'onOk' | 'open' | 'onCancel'> {
    modalStore: UseBoundStore<StoreApi<ModalFormState<T>>>;
    formFields?: React.ReactNode;
    form?: FormInstance;
    initialValues?: Record<string, any>;
    onSave?: (formValue: any) => Promise<boolean>;
    children?: any;
    hiddenOk?: boolean;
}

export const GenericModalForm = <T extends object>({
                                                       modalStore,
                                                       formFields,
                                                       form,
                                                       initialValues = {},
                                                       onSave,
                                                       children,
                                                       hiddenOk,
                                                       ...modalProps
                                                   }: Props<T>) => {
    const {open, close, dataItem} = modalStore();
    const [internalForm] = Form.useForm();
    const usedForm = form || internalForm;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const [isAddNewContinue, setIsAddNewContinue] = useState(false);
    const [saving, setSaving] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const {t} = useTranslation();

    useEffect(() => {
        if (open) {
            usedForm.setFieldsValue(dataItem || {});
        } else {
            usedForm.resetFields();
            setIsAddNewContinue(false);
        }
    }, [open]);

    const handleFinish = async () => {
        if (!onSave) {
            return;
        }
        if (saving) {
            return;
        }
        setSaving(true);
        try {
            const values = await usedForm.validateFields();

            const result = await onSave(values);
            if (!result) {
                return;
            }
            close();
        // eslint-disable-next-line no-empty -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
        } catch {

        } finally {
            setSaving(false);
        }
    };

    const onOkModal = () => {
        usedForm?.submit();
    };

    const closeModal = () => {
        close();
        usedForm.resetFields();
    };

    const disableHostKeyScopeForm_w = Form.useWatch('disableHostKeyScopeForm', usedForm);
    useHotkeys('F8', (event) => {
        if (open && usedForm && !disableHostKeyScopeForm_w) {
            usedForm.validateFields()
                .then(() => {
                    onOkModal();
                    event.preventDefault();
                }).catch(() => {
            });
        }
    }, {
        enableOnFormTags: true,
        enabled: !disableHostKeyScopeForm_w
    });

    useHotkeys('F10', (event) => {
        close();
        event.preventDefault();
    }, {
        enableOnFormTags: true,
        enabled: !disableHostKeyScopeForm_w
    });
    const defaultFooter = (
        <FooterCrudModal
            hasAddNewContinue={false}
            onOk={onOkModal}
            onCancel={closeModal}
            hiddenOk={hiddenOk}
        />
    );
    const modalClassName = ['ord-crud-modal', modalProps.className].filter(Boolean).join(' ');

    return (
        <Modal
            open={open}
            onCancel={closeModal}
            onOk={handleFinish}
            maskClosable={false}
            destroyOnHidden={true}
            footer={defaultFooter}
            width={680}
            style={{
                top: '30px'
            }}
            {...modalProps}
            className={modalClassName}
        >
            <Form
                autoComplete="off"
                layout='vertical'
                clearOnDestroy
                form={usedForm}
                onFinish={handleFinish}
                onFinishFailed={() => {
                    setSaving(false);
                    uiUtils.showCommonValidateForm();
                }}
                initialValues={initialValues}
            >
                {formFields}
                <Form.Item name={'disableHostKeyScopeForm'} initialValue={false} hidden noStyle></Form.Item>
            </Form>
            {children}
        </Modal>
    );
};
