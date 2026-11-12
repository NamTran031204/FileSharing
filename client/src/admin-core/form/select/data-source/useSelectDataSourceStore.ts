// store/useSelectDataSourceStore.ts
import {create} from 'zustand';
import {type IOrdSelectOption} from '@plugin-core/form/select/OrdSelect';

interface SelectDataSourceState {
    dataOptions: Record<string, IOrdSelectOption[]>;
    lock: Record<string, boolean>;
    dataGetOptionsApi: Record<string, () => Promise<IOrdSelectOption[]>>;

    getOptions: (key: string, optionsFunc: () => Promise<IOrdSelectOption[]>) => Promise<void>;
    clearByName: (key: string) => void;
    refreshByName: (key: string) => Promise<void>;
}

export const useSelectDataSourceStore = create<SelectDataSourceState>((set, get) => ({
    dataOptions: {},
    lock: {},
    dataGetOptionsApi: {},

    getOptions: async (key, optionsFunc) => {
        const {dataOptions, lock} = get();

        if (dataOptions[key] && dataOptions[key].length > 0) return;
        if (lock[key]) return;

        // Đánh dấu đang gọi API
        set((state) => ({
            lock: {...state.lock, [key]: true},
            dataGetOptionsApi: {...state.dataGetOptionsApi, [key]: optionsFunc},
        }));

        try {
            const data = await optionsFunc();
            set((state) => ({
                dataOptions: {...state.dataOptions, [key]: data},
            }));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
        } catch (error) {
            // Handle error nếu cần
            // console.error(`Error fetching options for key: ${key}`, error);
        } finally {
            set((state) => ({
                lock: {...state.lock, [key]: false},
            }));
        }
    },

    clearByName: (key) => {
        const {dataOptions, lock} = get();
        const newDataOptions = {...dataOptions};
        const newLock = {...lock};

        Object.keys(newDataOptions).forEach((k) => {
            if (k.toLowerCase().includes(key.toLowerCase())) {
                delete newDataOptions[k];
                delete newLock[k];
            }
        });

        set({
            dataOptions: newDataOptions,
            lock: newLock,
        });
    },

    refreshByName: async (key: string) => {
        const {dataGetOptionsApi, dataOptions, lock} = get();
        const matchedKeys = Object.keys(dataOptions).filter((sourceKey) =>
            sourceKey.toLowerCase().includes(key.toLowerCase())
        );

        if (matchedKeys.length === 0) {
            return;
        }

        await Promise.all(
            matchedKeys.map(async (matchedKey) => {
                const optionsFunc = dataGetOptionsApi[matchedKey];

                if (!optionsFunc) {
                    const newDataOptions = {...dataOptions};
                    const newLock = {...lock};
                    delete newDataOptions[matchedKey];
                    delete newLock[matchedKey];
                    set({
                        dataOptions: newDataOptions,
                        lock: newLock,
                    });
                    return;
                }

                if (lock[matchedKey]) return;

                set((state) => ({
                    lock: {...state.lock, [matchedKey]: true},
                }));

                try {
                    const data = await optionsFunc();
                    set((state) => ({
                        dataOptions: {...state.dataOptions, [matchedKey]: data},
                    }));
                } catch (error) {
                    console.error(`Failed refresh select data source: ${matchedKey}`, error);
                } finally {
                    set((state) => ({
                        lock: {...state.lock, [matchedKey]: false},
                    }));
                }
            })
        );
    },
}));
