import { Navigate, useLocation } from 'react-router-dom';
import {tokenManager} from "../api/baseApi.ts";
import React from "react";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const isAuthenticated = !!tokenManager.getAccessToken();
    const location = useLocation();

    if (!isAuthenticated) {
        // giu trang dang mo (vd /s/{token}) de dang nhap xong quay lai
        return <Navigate to="/loginv2" replace state={{ from: location }} />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;