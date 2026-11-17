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

export interface AppRoute extends Omit<RouteObject, 'children'> {
    path?: string;
    name?: string;
    redirectTo?: string; // không truyền gì mặc định = path
    element?: ReactNode; // react component
    icon?: ReactNode; // antd icon
    isShow?: boolean; // dùng sau
    roles?: string[];
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
        name: 'Home',
        element: <MainPage/>
    },
    {
        path: '/preview/*',
        name: 'Preview',
        element: <FilePreviewPage/>,
    },
    {
        path: '/my-files',
        name: 'My Files',
        element: <UserFilePage/>,
    },
    {
        path: '/upload',
        name: 'Upload',
        element: <UploadPage/>,
    },
    {
        path: '/profile',
        name: 'Profile',
        element: <UserProfilePage/>,
    },
    {
        path: '/trash',
        name: 'Trash',
        element: <TrashPage/>,
    },
    {
        path: '/mockup/image-review',
        name: 'Mockup Image Review',
        element: <LocalImageCanvas/>,
        isShow: false,
    },
    {
        path: '/review/image-v2',
        name: 'Image Review V2',
        element: <ImageReviewPage/>,
        isShow: false,
    },
    {
        path: '/review/video',
        name: 'Video Review',
        element: <VideoReviewPage/>,
        isShow: false,
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        element: <DashboardPage/>,
        isShow: true,
    },
    {
        path: '/projects',
        name: 'Projects',
        element: <ProjectMain/>,
        isShow: true,
    },
    {
        path: '/shared-with-me',
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
        name: 'Project Assets',
        element: <FolderAssetPage/>,
        isShow: false,
    },
    {
        // trang quan tri he thong: chi ROLE_SA (FE chi la UX, backend chan that o /api/admin/**)
        path: '/admin',
        name: 'Admin',
        element: <AdminHomePage/>,
        roles: ['ROLE_SA'],
        isShow: false,
    },
    {path: '/admin/users', name: 'Admin Users', element: <AdminUserPage/>, roles: ['ROLE_SA'], isShow: false},
    {path: '/admin/settings', name: 'Admin Settings', element: <AdminSettingPage/>, roles: ['ROLE_SA'], isShow: false},
    {path: '/admin/email-templates', name: 'Admin Email Templates', element: <AdminEmailTemplatePage/>, roles: ['ROLE_SA'], isShow: false},
    {path: '/admin/nodes', name: 'Admin Nodes', element: <AdminNodePage/>, roles: ['ROLE_SA'], isShow: false},
];