import SessionStore from './sessionStore';
import UiStore from './uiStore';
import FolderAssetStore from './folderAssetStore.ts';
import AssetStore from './assetStore';
import {UploadManagerStore} from './uploadManagerStore';
import { createContext, useContext } from 'react';
// import NotificationStore from './notificationStore';

const sessionStore = new SessionStore();

export const rootStore = {
    sessionStore,
    uiStore: new UiStore(),
    folderStore: new FolderAssetStore(sessionStore),
    assetStore: new AssetStore(),
    uploadManagerStore: new UploadManagerStore(),
    // notificationStore: new NotificationStore()
};
export type TRootStore = typeof rootStore;
const RootStoreContext = createContext<null | TRootStore>(null);

// tao ra provider de cung cap store cho toan bo app
export const Provider = RootStoreContext.Provider;

// tra lai store, chi dung o function component
export function useStore() {
    // store nay se chua toan bo data
    const store = useContext(RootStoreContext);
    if (store === null) {
        throw new Error('Store cannot be null, please add a context provider');
    }
    return store;
}
