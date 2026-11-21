import { Navigate, useLocation } from 'react-router-dom';
import {Spin} from 'antd';
import {observer} from 'mobx-react-lite';
import {tokenManager} from "../api/baseApi.ts";
import React from "react";
import {rootStore} from "../store";
import AccessDeniedScreen from "./share/AccessDeniedScreen.tsx";

interface ProtectedRouteProps {
    children: React.ReactNode;
    /** Chi cho vao khi user co it nhat 1 role trong danh sach; thieu -> man 403 (khong redirect login). Chi la UX, backend van chan that. */
    roles?: string[];
    /** 'admin': chi tai khoan phia quan tri (nguoc lai man 403). 'user': tai khoan phia quan tri bi dua ve /admin. Khong truyen = khong xet phia. */
    side?: 'user' | 'admin';
    /** Ten permission (vd Admin.User.GetPaged); thieu -> man 403. Chi la UX, backend van chan that. */
    permission?: string;
}

const ProtectedRoute = observer(({ children, roles, side, permission }: ProtectedRouteProps) => {
    const isAuthenticated = !!tokenManager.getAccessToken();
    const location = useLocation();
    const {sessionStore} = rootStore;

    if (!isAuthenticated) {
        // giu trang dang mo (vd /s/{token}) de dang nhap xong quay lai
        return <Navigate to="/loginv2" replace state={{ from: location }} />;
    }

    if (roles?.length || side || permission) {
        // doi nap xong user hien tai (SessionBootstrap) roi moi quyet dinh
        if (!sessionStore.userLoaded) {
            return <div className="flex h-screen items-center justify-center"><Spin size="large" /></div>;
        }
        const granted = sessionStore.appSession.permissionGranted;
        const adminSide = sessionStore.appSession.user?.adminSide === true;
        if (side === 'user' && adminSide) {
            return <Navigate to="/admin" replace />;
        }
        if (side === 'admin' && !adminSide) {
            return <AccessDeniedScreen />;
        }
        if (roles?.length && !roles.some((role) => granted?.[role] === true)) {
            return <AccessDeniedScreen />;
        }
        if (permission && granted?.[permission] !== true) {
            return <AccessDeniedScreen />;
        }
    }

    return <>{children}</>;
});

export default ProtectedRoute;
