/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {type ModalProps} from "antd";
import {type SearchablePagedTableProps} from "@plugin-core/table/paged/components/SearchablePagedTable";
import {type RowSelectionConfig} from "@plugin-core/table/paged/hooks/useRowSelectionStore";

export interface RenderBulkActionInput {
    selectedRowKeys: any[];
    selectedRows: any[];
    onCloseModal: () => void;
    clearSelection: () => void;
    onReloadTableModal: () => void;
}

export interface UseTableSearchModalConfig<T = any> {
    title?: React.ReactNode;
    tableProps: SearchablePagedTableProps<T>;
    modalProps?: Omit<ModalProps, 'onOk' | 'open' | 'onCancel'>;
    rowSelectionConfig?: RowSelectionConfig;
}

export interface OpenModalInput {
    modalData?: any;
    title?: React.ReactNode;
    renderBulkActions?: (input: RenderBulkActionInput) => React.ReactNode;
}
