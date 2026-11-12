import {create} from 'zustand';
import {v4 as uuidv4} from "uuid";
import {type GlobalModalConfig, type ModalData} from "../types";


interface UseGlobalModalStore {
    modals: GlobalModalConfig[];
    topModalId: string | null;
    openModal: (config: Omit<GlobalModalConfig, 'id'>, modalId?: string | null) => string;
    closeModal: (modalId: string) => void;
    closeAllModals: () => void;
    updateModalData: (modalId: string, data: Partial<ModalData>) => void;
    getModal: (modalId: string) => GlobalModalConfig | undefined;
    getTopModalId: () => string | null;
}

export const useGlobalModalStore = create<UseGlobalModalStore>((set, get) => ({
    modals: [],
    topModalId: null,
    openModal: (config, modalId?: string | null) => {
        modalId = modalId ?? uuidv4();
        const newModal: GlobalModalConfig = {
            ...config,
            id: modalId
        };
        const existing = get().modals.find(m => m.id === modalId);
        if (existing) {
            return modalId;
        }

        set((state) => ({
            modals: [...state.modals, newModal],
            topModalId: modalId,
        }));
        return modalId;
    },

    closeModal: (modalId) => {
        set((state) => {
            const newModals = state.modals.filter((modal) => modal.id !== modalId);
            const lastVisible = [...newModals][newModals.length - 1];
            return {
                modals: newModals,
                topModalId: lastVisible?.id || null,
            };
        });
    },

    closeAllModals: () => {
        set({
            modals: [],
            topModalId: null,
        });
    },

    updateModalData: (modalId, newData) => {
        set((state) => ({
            modals: state.modals.map((modal) =>
                modal.id === modalId
                    ? {
                        ...modal,
                        data: modal.modalData ? {...modal.modalData, ...newData} : newData,
                    }
                    : modal
            ),
        }));
    },

    getModal: (modalId) => {
        return get().modals.find((modal) => modal.id === modalId);
    },
    getTopModalId: () => {
        const modals = get().modals;
        const lastVisible = [...modals][modals.length - 1];
        return lastVisible?.id || null;
    },
}));
