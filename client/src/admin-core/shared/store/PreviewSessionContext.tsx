import {createContext, useContext, useMemo, type ReactNode} from 'react';
import type {AppSessionDto} from '../../../store/sessionStore';

// Phien gia lap chi dung trong cac route /admin-preview/* (spec D7). Khong ghi vao rootStore.sessionStore.
import {PREVIEW_SA_EMAIL, PREVIEW_SA_USER_ID} from './previewSessionConst';

const buildPreviewSession = (): AppSessionDto => ({
    isLogined: true,
    user: {
        userId: PREVIEW_SA_USER_ID,
        email: PREVIEW_SA_EMAIL,
        publicUserName: 'SA Preview',
        enabled: true,
    },
    permissionGranted: {ROLE_SA: true},
} as unknown as AppSessionDto);

const PreviewSessionContext = createContext<AppSessionDto | null>(null);

export const PreviewSessionProvider = ({children}: {children: ReactNode}) => {
    const session = useMemo(buildPreviewSession, []);
    return <PreviewSessionContext.Provider value={session}>{children}</PreviewSessionContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
export const usePreviewSession = () => useContext(PreviewSessionContext);
