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
}

const ProtectedRoute = observer(({ children, roles }: ProtectedRouteProps) => {
    const isAuthenticated = !!tokenManager.getAccessToken();
    const location = useLocation();
    const {sessionStore} = rootStore;

    if (!isAuthenticated) {
        // giu trang dang mo (vd /s/{token}) de dang nhap xong quay lai
        return <Navigate to="/loginv2" replace state={{ from: location }} />;
    }

    if (roles?.length) {
        // doi nap xong user hien tai (SessionBootstrap) roi moi quyet dinh
        if (!sessionStore.userLoaded) {
            return <div className="flex h-screen items-center justify-center"><Spin size="large" /></div>;
        }
        if (!roles.some((role) => sessionStore.appSession.permissionGranted?.[role] === true)) {
            return <AccessDeniedScreen />;
        }
    }

    return <>{children}</>;
});

export default ProtectedRoute;
