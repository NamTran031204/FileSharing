import {rootStore} from '../../../store';
import {usePreviewSession} from './PreviewSessionContext';
import type {AppSessionDto} from '../../../store/sessionStore';

// Cau noi sang MobX rootStore.sessionStore (spec D13). Chi doc, khong ghi.
export interface SessionState {
    appSession: AppSessionDto;
    user: AppSessionDto['user'];
    userId: string | null;
    isLogined: boolean;
    systemCode: undefined;
}

export const useSessionStore = <T,>(selector: (s: SessionState) => T): T => {
    const preview = usePreviewSession();
    const appSession = preview ?? rootStore.sessionStore.appSession;
    return selector({
        appSession,
        user: appSession.user,
        userId: appSession.user?.userId ?? null,
        isLogined: appSession.isLogined,
        systemCode: undefined,
    });
};
