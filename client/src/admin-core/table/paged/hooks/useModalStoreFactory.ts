/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {create} from 'zustand';

interface IHandler {
    onAfterSuccess?: () => void;
    onAfterError?: () => void;
    onAfterClose?: () => void;
}

export interface ModalFormState<T = any> {
    open: boolean;
    dataItem: T | null;
    handler: IHandler | null;
    openModal: (item: T, handler?: IHandler) => void;
    close: () => void;

}

export const createModalStore = <TDetail extends object>() =>
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    create<ModalFormState<TDetail>>((set, get) => ({
        open: false,
        dataItem: null,
        handler: null,
        openModal: (item, handler?: IHandler) => {
            set({open: true, dataItem: {...item}, handler});
        },
        close: () => set({open: false, dataItem: null, handler: null})
    }));
