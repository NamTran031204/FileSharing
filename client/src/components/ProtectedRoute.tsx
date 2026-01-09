import { Navigate } from 'react-router-dom';
import {tokenManager} from "../api/baseApi.ts";
import React from "react";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const isAuthenticated = !!tokenManager.getAccessToken();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;