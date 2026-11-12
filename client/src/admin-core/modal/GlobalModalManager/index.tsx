import React, {useCallback, useMemo} from 'react';
import {Form, Modal} from 'antd';
import {useGlobalModalStore} from "./hook/useGlobalModalStore";
import {type GlobalModalConfig, type RenderGlobalContentModalInput} from "./types";
import {useModalHotkeys} from "./hook/useModalHotkeys";
import {useRowSelectionStore} from "@plugin-core/table/paged/hooks/useRowSelectionStore";

const SingleModal: React.FC<{ modal: GlobalModalConfig }> = ({modal}) => {
    const {
        id,
        modalData,
        modalProps,
        renderModalContent,
        renderModalFooter,
        rowSelectionConfig
    } = modal;

    const {closeModal} = useGlobalModalStore();
    const [internalForm] = Form.useForm();
    // Event handlers
    const handleCancel = useCallback(() => {
        closeModal(id);
    }, [closeModal]);

    // Modal props configuration
    const modalPropsConfig = useMemo(() => ({
        style: {top: 30},
        maskClosable: false,
        width: 800,
        destroyOnHidden: true,
        ...modalProps,
        title: modal.title,
        open: true,
        onCancel: handleCancel
    }), [modalProps, modal.title, handleCancel]);
    const rowSelectionStore = useRowSelectionStore(rowSelectionConfig || {});
    const renderInput = useMemo(() => {
        return {
            internalForm,
            modalData,
            onClose: handleCancel,
            rowSelectionStore: rowSelectionStore
        } as RenderGlobalContentModalInput;
    }, [internalForm, modalData, handleCancel, rowSelectionStore])
    const modalContent = useMemo(() => {
        return renderModalContent(renderInput);
    }, [renderInput]);
    const modalFooter = useMemo(() => {
        return renderModalFooter(renderInput);
    }, [renderInput]);
    useModalHotkeys({
        modalId: id,
        onHandlerHotKey: {
            F10: {
                handler: () => {
                    handleCancel();
                }
            },
            F8: {
                handler: () => {
                    internalForm?.submit();
                },
                debounceTime: 250
            }
        }
    });

    return (
        <Modal {...modalPropsConfig} footer={modalFooter}>
            {modalContent}
        </Modal>
    );
};

// Main GlobalModalManager Component
export const GlobalModalManager: React.FC = React.memo(() => {
    const {modals} = useGlobalModalStore();
    return (
        <>
            {modals.map((modal) => (
                <SingleModal key={modal.id} modal={modal}/>
            ))}
        </>
    );
});
