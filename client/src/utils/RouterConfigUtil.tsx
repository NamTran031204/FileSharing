import type { ReactNode } from 'react';
import LoginPage from "../page/Phase1/auth/LoginPage.tsx";
import RegisterPage from "../page/Phase1/auth/RegisterPage.tsx";
import UserFilePage from "../page/Phase1/userFilePage";
import UploadPage from "../page/Phase1/uploadPage";
import UserProfilePage from "../page/Phase1/UserProfilePage/UserProfilePage.tsx";
import TrashPage from "../page/Phase1/trashPage";
import ImageReviewPage from "../page/ImageReviewPage.tsx";
import ImageReviewV2 from "../page/ImageReviewV2.tsx";
import LocalImageCanvas from "../mockup/pages/KonvaDemo.tsx";

export interface AppRoute {
    path?: string;
    index?: boolean;
    element?: ReactNode;
    redirectTo?: string;
    isProtected?: boolean;
    children?: AppRoute[];
}

export const ROUTER_CONFIG: AppRoute[] = [
    {
        path: '/',
        redirectTo: '/login'
    },
    {
        path: '/login',
        element: <LoginPage />
    },
    {
        path: '/register',
        element: <RegisterPage />
    },
    {
        path: '/my-files',
        element: <UserFilePage />,
        isProtected: true
    },
    { path: '/upload', element: <UploadPage />, isProtected: true },
    { path: '/profile', element: <UserProfilePage />, isProtected: true },
    { path: '/trash', element: <TrashPage />, isProtected: true },
    { path: '/review/image', element: <ImageReviewPage />, isProtected: true },
    { path: '/review/image-v2', element: <ImageReviewV2 />, isProtected: true },
    { path: '/mockup/image-review', element: <LocalImageCanvas /> },
];