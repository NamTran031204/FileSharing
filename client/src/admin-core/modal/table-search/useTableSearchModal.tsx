import {useGlobalModalStore} from "../GlobalModalManager/hook/useGlobalModalStore";
import {TableSearchModalContent} from "./TableSearchModalContent";
import {TableSearchModalFooter} from "./TableSearchModalFooter";
import {type OpenModalInput, type UseTableSearchModalConfig} from "./types";

// eslint-disable-next-line react-refresh/only-export-components -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
export * from './types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
export const useTableSearchModal = <T extends object>(config: UseTableSearchModalConfig) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const {openModal, closeModal} = useGlobalModalStore();
    const {
        title,
        modalProps = {width: 1200},
        tableProps,
        rowSelectionConfig
    } = config;

    const openTableModal = (input?: OpenModalInput) => {
        const {
            modalData = {},
            renderBulkActions
        } = input || {};
        return openModal({
            title: input?.title || title,
            modalData: modalData,
            modalProps,
            renderModalContent: (inputRender) => {
                return (
                    <TableSearchModalContent tableProps={tableProps}
                                             modalData={modalData}
                                             renderInput={inputRender}
                                             isHasSelectionRow={!!renderBulkActions}
                    />
                );
            },
            renderModalFooter: (renderInput) => {
                return <TableSearchModalFooter renderInput={renderInput}
                                               renderBulkActions={renderBulkActions}/>;
            },
            rowSelectionConfig
        });
    };
    return {
        openTableModal,
    }
}
