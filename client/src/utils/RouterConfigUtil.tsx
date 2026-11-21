import type {ReactNode} from 'react';
import type {RouteObject} from "react-router-dom";
import LoginPage from '../page/Phase1/auth/LoginPage';
import RegisterPage from '../page/Phase1/auth/RegisterPage';
import UserFilePage from '../page/Phase1/userFilePage';
import UploadPage from '../page/Phase1/uploadPage';
import UserProfilePage from '../page/UserProfilePage.tsx';
import TrashPage from '../page/Phase1/trashPage';
import FilePreviewPage from '../page/Phase1/filePreviewPage';
import LoginPageV2 from '../page/LoginPageV2.tsx';
import RegisterPageV2 from '../page/RegisterPageV2.tsx';
import MainPage from '../page/MainPage';
import LocalImageCanvas from '../mockup/pages/KonvaDemo.tsx';
import HlsVideoMockup from '../mockup/pages/HlsVideoMockup.tsx';
import ProjectMain from "../page/ProjectMain.tsx";
import ImageReviewPage from "../page/ImageReviewPage.tsx";
import VideoReviewPage from "../page/VideoReviewPage.tsx";
import FolderAssetPage from "../page/FolderAssetPage.tsx";
import DashboardPage from "../page/DashboardPage.tsx";
import ProofGuestPage from "../page/ProofGuestPage.tsx";
import SharedWithMePage from "../page/SharedWithMePage.tsx";
import JoinLinkPage from "../page/JoinLinkPage.tsx";
import AdminHomePage from "../page/admin/AdminHomePage.tsx";
import AdminUserPage from "../page/admin/AdminUserPage.tsx";
import AdminSettingPage from "../page/admin/AdminSettingPage.tsx";
import AdminEmailTemplatePage from "../page/admin/AdminEmailTemplatePage.tsx";
import AdminNodePage from "../page/admin/AdminNodePage.tsx";
import AdminRolePage from "../page/admin/AdminRolePage.tsx";
import {ADMIN_PER} from "../components/core/layout/sidebarMenu.ts";

export interface AppRoute extends Omit<RouteObject, 'children'> {
    path?: string;
    name?: string;
    redirectTo?: string; // không truyền gì mặc định = path
    element?: ReactNode; // react component
    icon?: ReactNode; // antd icon
    isShow?: boolean; // dùng sau
    roles?: string[];
    side?: 'user' | 'admin'; // phia tai khoan duoc vao route, xem ProtectedRoute
    permission?: string; // permission can co, xem ProtectedRoute
    isPublic?: boolean; // true = khong bao ProtectedRoute, mac dinh moi route deu can dang nhap
    children?: AppRoute[];
}

export const ROUTER_CONFIG: AppRoute[] = [
    {
        path: '/',
        isPublic: true,
        redirectTo: '/home',
        isShow: false,
    },
    {
        path: '/login',
        isPublic: true,
        name: 'Login',
        element: <LoginPage/>,
        isShow: false,
    },
    {
        path: '/loginv2',
        isPublic: true,
        name: 'Login V2',
        element: <LoginPageV2/>,
        isShow: false,
    },
    {
        path: '/registerv2',
        isPublic: true,
        name: 'Register V2',
        element: <RegisterPageV2/>,
        isShow: false,
    },
    {
        path: '/register',
        isPublic: true,
        name: 'Register',
        element: <RegisterPage/>,
        isShow: false,
    },
    {
        path: '/home',
        side: 'user',
        name: 'Home',
        element: <MainPage/>
    },
    {
        path: '/preview/*',
        side: 'user',
        name: 'Preview',
        element: <FilePreviewPage/>,
    },
    {
        path: '/my-files',
        side: 'user',
        name: 'My Files',
        element: <UserFilePage/>,
    },
    {
        path: '/upload',
        side: 'user',
        name: 'Upload',
        element: <UploadPage/>,
    },
    {
        path: '/profile',
        side: 'user',
        name: 'Profile',
        element: <UserProfilePage/>,
    },
    {
        path: '/trash',
        side: 'user',
        name: 'Trash',
        element: <TrashPage/>,
    },
    {
        path: '/mockup/image-review',
        side: 'user',
        name: 'Mockup Image Review',
        element: <LocalImageCanvas/>,
        isShow: false,
    },
    {
        path: '/review/image-v2',
        side: 'user',
        name: 'Image Review V2',
        element: <ImageReviewPage/>,
        isShow: false,
    },
    {
        path: '/review/video',
        side: 'user',
        name: 'Video Review',
        element: <VideoReviewPage/>,
        isShow: false,
    },
    {
        path: '/dashboard',
        side: 'user',
        name: 'Dashboard',
        element: <DashboardPage/>,
        isShow: true,
    },
    {
        path: '/projects',
        side: 'user',
        name: 'Projects',
        element: <ProjectMain/>,
        isShow: true,
    },
    {
        path: '/shared-with-me',
        side: 'user',
        name: 'Shared With Me',
        element: <SharedWithMePage/>,
        isShow: true,
    },
    {
        // link xem cua folder: can dang nhap, ProtectedRoute dua ve login roi quay lai
        path: '/s/:token',
        name: 'Join Link',
        element: <JoinLinkPage/>,
        isShow: false,
    },
    {
        path: '/mockup/hls-video',
        side: 'user',
        name: 'Mockup HLS Video',
        element: <HlsVideoMockup/>,
        isShow: false,
    },
    {
        path: '/proof/:shareToken',
        isPublic: true,
        name: 'Proof',
        element: <ProofGuestPage/>,
        isShow: false,
    },
    {
        path: '/projects/:projectId',
        side: 'user',
        name: 'Project Assets',
        element: <FolderAssetPage/>,
        isShow: false,
    },
    {
        // trang quan tri: gate theo phia + permission (FE chi la UX, backend chan that o /api/admin/**)
        path: '/admin',
        name: 'Admin',
        element: <AdminHomePage/>,
        side: 'admin',
        isShow: false,
    },
    {path: '/admin/users', name: 'Admin Users', element: <AdminUserPage/>, side: 'admin', permission: ADMIN_PER.User.GetPaged, isShow: false},
    {path: '/admin/roles', name: 'Admin Roles', element: <AdminRolePage/>, side: 'admin', permission: ADMIN_PER.Role.GetPaged, isShow: false},
    {path: '/admin/settings', name: 'Admin Settings', element: <AdminSettingPage/>, side: 'admin', permission: ADMIN_PER.Setting.GetPaged, isShow: false},
    {path: '/admin/email-templates', name: 'Admin Email Templates', element: <AdminEmailTemplatePage/>, side: 'admin', permission: ADMIN_PER.EmailTemplate.GetPaged, isShow: false},
    {path: '/admin/nodes', name: 'Admin Nodes', element: <AdminNodePage/>, side: 'admin', permission: ADMIN_PER.Node.GetPaged, isShow: false},
];
