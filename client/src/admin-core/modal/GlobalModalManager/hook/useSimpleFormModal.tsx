/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {useRef} from 'react';
import {type FormInstance, type ModalProps} from 'antd';
import {useGlobalModalStore} from './useGlobalModalStore';
import {OrdModalFooter} from '../../footer/OrdModalFooter';
import {OrdModalSaveButton} from '../../footer/buttons/OrdModalSaveButton';
import UiUtils from '@plugin-core/shared/utils/ui.utils';
import {FormModalBodyContent} from "../components/FormModalContent";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
export interface UseSimpleFormModalConfig<T = any> {
    title: React.ReactNode;
    formFields: React.ReactNode;
    submitLabel?: React.ReactNode;
    submitIcon?: React.ReactNode;
    onSaved?: () => void;
    modalProps?: Omit<ModalProps, 'onOk' | 'open' | 'onCancel'>;
}

export type IOnSubmitFormAction<TData = any> = (
    formValue: Partial<TData> & Record<string, any>,
    form: FormInstance,
    modalData: TData
) => Promise<{ mustCloseModal: boolean; mustResetForm?: boolean }>

export const useSimpleFormModal = <T extends object>(config: UseSimpleFormModalConfig<T>) => {
    const {openModal, closeModal} = useGlobalModalStore();
    const isSubmittingRef = useRef(false);

    const {
        title,
        formFields,
        submitIcon,
        submitLabel,
        onSaved,
        modalProps,
    } = config;

    const openFormModal = <TData = any>(
        modalData: TData = {} as TData,
        onSubmit: IOnSubmitFormAction,
        customRenderFooter?: (
            onClose: () => void,
            internalForm: FormInstance,
            modalData?: TData
        ) => React.ReactNode
    ) => {
        const modalId = openModal({
            title,
            modalProps,
            renderModalContent: ({internalForm}) => {
                const onHandlerSubmit = async (values: any, form: FormInstance) => {
                    if (isSubmittingRef.current) return;
                    isSubmittingRef.current = true;
                    UiUtils.setBusy();
                    try {
                        const result = await onSubmit(values, form, modalData);
                        if (result?.mustCloseModal) {
                            closeModal(modalId);
                        }
                        onSaved?.();
                    } catch (error) {
                        console.error('[useSimpleFormModal] Submit error:', error);
                    } finally {
                        isSubmittingRef.current = false;
                        UiUtils.clearBusy();
                    }
                }
                return <FormModalBodyContent internalForm={internalForm}
                                             onFinish={onHandlerSubmit}
                                             formFields={formFields}
                                             initialValues={modalData}
                />
            },
            renderModalFooter: ({onClose, internalForm}) => {
                if (customRenderFooter) {
                    return customRenderFooter?.(onClose, internalForm, modalData);
                }
                return <OrdModalFooter
                    onClose={onClose}
                    right={[
                        <OrdModalSaveButton
                            key="save"
                            icon={submitIcon}
                            label={submitLabel}
                            onSubmit={() => internalForm.submit()}
                        />,
                    ]}
                />;
            }
        });

        return modalId;
    }

    return {
        openFormModal,
    };
};
