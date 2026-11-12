/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import type {FormInstance, ModalProps} from 'antd';
import {type RowSelectionConfig, type UseRowSelectionResult} from "@plugin-core/table/paged/hooks/useRowSelectionStore";
import {type ModifyModalI18nConfig} from "@plugin-core/table/paged/hooks/useModifyModalI18n";
import {type ICommonResultDtoApi, type IModifyApiService} from "@plugin-core/table/paged/types";

export interface ModalData {
    encodedId?: string;

    [key: string]: any;
}

export interface RenderGlobalContentModalInput<TModalData = ModalData> {
    internalForm: FormInstance;
    modalData?: TModalData | null;
    onClose: () => void;
    rowSelectionStore: UseRowSelectionResult<any>;
}

export interface GlobalModalConfig<TModalData = ModalData> {
    id: string;
    title?: React.ReactNode;
    modalProps?: ModalProps;
    modalData?: TModalData | null;
    renderModalContent: (inputRender: RenderGlobalContentModalInput<TModalData>) => React.ReactNode;
    renderModalFooter: (inputRender: RenderGlobalContentModalInput<TModalData>) => React.ReactNode;

    // dành riêng cho useTableSearchModal
    rowSelectionConfig?: RowSelectionConfig;
}

export interface UseModifyEntityLogicConfig<T = any> {
    entityTranslationNs: string;
    apiService: IModifyApiService;
    crudSettings?: {
        transformBeforeCreate?: (values: Partial<T>) => void;
        transformBeforeUpdate?: (values: Partial<T>, editingItem: T) => void;
        onSuccess?: (result: ICommonResultDtoApi<T>, mode: 'create' | 'edit') => void;
    };
    onSaved?: () => void;
    transformNotificationParameter: (entity: T) => Record<string, any>;
    i18nConfig?: ModifyModalI18nConfig;
}

export interface UseModifyModalConfig<T = any> extends UseModifyEntityLogicConfig<T> {
    formFields: React.ReactNode;
    initialValues?: Record<string, any>;
    modalProps?: Omit<ModalProps, 'onOk' | 'open' | 'onCancel'>;
}
