import SessionStore from './sessionStore';
import {createContext, useContext} from "react";
// import NotificationStore from './notificationStore';

export const rootStore = {
    sessionStore: new SessionStore(),
    // notificationStore: new NotificationStore()
};
export type TRootStore = typeof rootStore;
const RootStoreContext = createContext<null | TRootStore>(null);


// Tạo ra provider để cung cấp store cho toàn bộ app
export const Provider = RootStoreContext.Provider;

/** tra lai store, chi dung o function component */
export function useStore() {
    /** store này sẽ chứa toàn bộ data */
    const store = useContext(RootStoreContext);
    if (store === null) {
        throw new Error("Store cannot be null, please add a context provider");
    }
    return store;
}
