/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {useCallback, useRef} from "react";
import {type FormInstance} from "antd";
import {useApiHandler} from "@plugin-core/shared/hooks/api/useApiHandler";
import UiUtils from "@plugin-core/shared/utils/ui.utils";
import _ from "lodash";
import {type UseModifyEntityLogicConfig} from "../types";
import {useModifyModalI18n} from "@plugin-core/table/paged/hooks/useModifyModalI18n";


export const useCrudApiActions = <T extends object>(config: UseModifyEntityLogicConfig<T>) => {
    const {
        apiService,
        crudSettings,
        onSaved,
        transformNotificationParameter,
        entityTranslationNs,
        i18nConfig
    } = config;
    const {
        getTitleText,
        getSuccessMessage,
        getDeleteSuccessMessage,
        getConfirmContent,
        getConfirmTitle,
    } = useModifyModalI18n({entityTranslationNs, i18nConfig});
    const {handleCallApi} = useApiHandler();

    const isSubmittingRef = useRef(false);
    const continueAddRef = useRef(false);

    const handleCreate = useCallback(async (values: any, usedForm: FormInstance, resetFormValues: any, closeModal: (id: string) => void, modalId: string) => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        const body = _.omit(values, ["extendUi"]);
        crudSettings?.transformBeforeCreate?.(body);

        await handleCallApi(body, {
            apiCall: (body) => apiService.create({body}),
            onSuccess: (resultData) => {
                onSaved?.();
                crudSettings?.onSuccess?.(resultData, "create");
                if (!continueAddRef.current) {
                    closeModal(modalId);
                } else {
                    usedForm.resetFields();
                    usedForm.setFieldsValue(resetFormValues);
                }
            },
            successMessageFn: (resultData) => getSuccessMessage("create", transformNotificationParameter(resultData)),
            onFinally: () => (isSubmittingRef.current = false),
        });
    }, [apiService, crudSettings, onSaved]);

    const handleEdit = useCallback(async (values: any, editingItem: any, usedForm: FormInstance, closeModal: (id: string) => void, modalId: string) => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        const body = _.omit(values, ["extendUi"]);
        crudSettings?.transformBeforeUpdate?.(body, editingItem);

        await handleCallApi(body, {
            apiCall: (body) => apiService.update({body}),
            onSuccess: (resultData) => {
                onSaved?.();
                crudSettings?.onSuccess?.(resultData, "edit");
                closeModal(modalId);
            },
            successMessageFn: (resultData) => getSuccessMessage("edit", transformNotificationParameter(resultData)),
            onFinally: () => (isSubmittingRef.current = false),
        });
    }, [apiService, crudSettings, onSaved]);

    const handleDelete = useCallback((deletingItem: T) => {
        return new Promise<void>((resolve) => {
            const confirmContent = getConfirmContent(transformNotificationParameter(deletingItem));
            const confirmTitle = getConfirmTitle();
            UiUtils.showConfirm({
                title: confirmTitle,
                icon: 'remove',
                content: confirmContent,
                onOk: async () => {
                    if (!apiService.remove) return resolve();
                    UiUtils.setBusy();
                    try {
                        const result = await apiService.remove({body: {encodedId: (deletingItem as any)?.encodedId}});
                        if (!result?.isSuccessful) {
                            // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
                            result?.message && UiUtils.showError(result.message);
                            return resolve();
                        }
                        onSaved?.();
                        UiUtils.showSuccess(getDeleteSuccessMessage(transformNotificationParameter(deletingItem)));
                        resolve();
                    } catch {
                        resolve();
                    } finally {
                        UiUtils.clearBusy();
                    }
                },
                onCancel: resolve,
            });
        });
    }, [apiService, onSaved]);

    return {
        handleCreate,
        handleEdit,
        handleDelete,
        continueAddRef,
        getTitleText
    };
};
