/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {
    SearchablePagedTable,
    type SearchablePagedTableProps
} from "@plugin-core/table/paged/components/SearchablePagedTable";
import {type RenderGlobalContentModalInput} from "../GlobalModalManager/types";

export const TableSearchModalContent = (props: {
    modalData?: any;
    tableProps: SearchablePagedTableProps<any>;
    renderInput: RenderGlobalContentModalInput;
    isHasSelectionRow: boolean
}) => {
    const {
        modalData,
        tableProps,
        renderInput,
        isHasSelectionRow
    } = props;
    const {internalForm, rowSelectionStore} = renderInput;
    const {
        rowSelection,
        onChangeTableData
    } = rowSelectionStore;
    return <>
        <SearchablePagedTable
            initialSearchParams={modalData}
            {...(tableProps as SearchablePagedTableProps<object>)}
            searchForm={internalForm}
            rowSelection={isHasSelectionRow ? rowSelection : undefined}
            onChangeDataTable={onChangeTableData}
        />
    </>
}
