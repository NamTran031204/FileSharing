/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {useCallback} from "react";
import {Checkbox, type FormInstance} from "antd";
import {useGlobalModalStore} from "@plugin-core/modal";
import {OrdModalFooter} from "@plugin-core/modal";
import {OrdModalSaveButton} from "@plugin-core/modal";
import {FormModalBodyContent} from "../components/FormModalContent";
import {type UseModifyModalConfig} from "../types";
import {l} from "@plugin-core/shared/language/lang.utils";
import {useCrudApiActions} from "@plugin-core/modal";

export const useCrudModal = <T extends object>(config: UseModifyModalConfig<T>) => {
    const {openModal, closeModal} = useGlobalModalStore();
    const {
        apiService,
        crudSettings,
        formFields,
        entityTranslationNs = "common",
        onSaved,
        transformNotificationParameter,
        i18nConfig,
        modalProps = {},
    } = config;
    const {
        handleCreate,
        handleEdit,
        handleDelete,
        continueAddRef,
        getTitleText
    } = useCrudApiActions<T>({
        apiService,
        crudSettings,
        onSaved,
        entityTranslationNs,
        i18nConfig,
        transformNotificationParameter,
    });

    const renderFooter = useCallback((onClose: () => void, internalForm: any, mode: "add" | "edit") => (
        <OrdModalFooter
            onClose={onClose}
            left={mode === "add"
                ? [<Checkbox key="continueAdd" onChange={(e) => (continueAddRef.current = e.target.checked)}>
                    {l.transCommon("addNewContinue")}
                </Checkbox>]
                : []}
            right={[<OrdModalSaveButton key="save" onSubmit={() => internalForm.submit()}/>]}
        />
    ), []);

    const renderFormModalContent = useCallback((internalForm: FormInstance, initialValues: any, onFinish: any, disabled = false) => (
        <FormModalBodyContent
            internalForm={internalForm}
            formFields={formFields}
            onFinish={onFinish}
            initialValues={initialValues}
            disabled={disabled}
        />
    ), [formFields]);

    const openCreateModal = useCallback((customInitialValues: Record<string, any> = {}) => {
        // eslint-disable-next-line prefer-const -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
        let modalId: string;
        const formValueInit = {...customInitialValues, extendUi: {modifyMode: "add"}};
        const onSubmitForm = (values: any, usedForm: FormInstance) => handleCreate(values, usedForm, formValueInit, closeModal, modalId);

        modalId = openModal({
            title: getTitleText("create", {}),
            modalProps,
            renderModalContent: ({internalForm}) => renderFormModalContent(internalForm, formValueInit, onSubmitForm),
            renderModalFooter: ({onClose, internalForm}) => renderFooter(onClose, internalForm, "add"),
        }, "MODAL_ENTITY_" + entityTranslationNs);
        return modalId;
    }, [handleCreate]);

    const openEditModal = useCallback((editingItem: Record<string, any> = {}) => {
        // eslint-disable-next-line prefer-const -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
        let modalId: string;
        const formValueInit = {...editingItem, extendUi: {modifyMode: "edit", editingItem}};
        const onSubmitForm = (values: any, usedForm: FormInstance) => handleEdit(values, editingItem, usedForm, closeModal, modalId);

        modalId = openModal({
            title: getTitleText("edit", transformNotificationParameter(editingItem as T)),
            modalProps,
            renderModalContent: ({internalForm}) => renderFormModalContent(internalForm, formValueInit, onSubmitForm),
            renderModalFooter: ({onClose, internalForm}) => renderFooter(onClose, internalForm, "edit"),
        });
        return modalId;
    }, [handleEdit]);

    const openViewModal = useCallback((viewingItem: Record<string, any> = {}) => {
        return openModal({
            title: getTitleText("viewDetail", transformNotificationParameter(viewingItem as T)),
            modalProps,
            renderModalContent: ({internalForm}) => renderFormModalContent(
                internalForm,
                {...viewingItem, extendUi: {modifyMode: "view"}},
                async () => {
                },
                true
            ),
            renderModalFooter: ({onClose}) => <OrdModalFooter onClose={onClose}/>,
        });
    }, []);

    const openDeleteConfirm = useCallback((deletingItem: T) => {
        handleDelete(deletingItem);
    }, [handleDelete]);

    return {openCreateModal, openEditModal, openViewModal, openDeleteConfirm};
};
