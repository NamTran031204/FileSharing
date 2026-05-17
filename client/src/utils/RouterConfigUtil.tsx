import type {ReactNode} from 'react';
import type {RouteObject} from "react-router-dom";
import LoginPage from '../page/Phase1/auth/LoginPage';
import RegisterPage from '../page/Phase1/auth/RegisterPage';
import UserFilePage from '../page/Phase1/userFilePage';
import UploadPage from '../page/Phase1/uploadPage';
import UserProfilePage from '../page/Phase1/UserProfilePage/UserProfilePage.tsx';
import TrashPage from '../page/Phase1/trashPage';
import FilePreviewPage from '../page/Phase1/filePreviewPage';
import ImageReviewV2 from '../page/ImageReviewV2';
import LoginPageV2 from '../page/LoginPageV2.tsx';
import MainPage from '../page/MainPage';
import LocalImageCanvas from '../mockup/pages/KonvaDemo.tsx';
import HlsVideoMockup from '../mockup/pages/HlsVideoMockup.tsx';
import ProjectMain from "../page/ProjectMain.tsx";
import FolderAsset from "../page/FolderAsset.tsx";

export interface AppRoute extends Omit<RouteObject, 'children'> {
    path?: string;
    name?: string;
    redirectTo?: string; // không truyền gì mặc định = path
    element?: ReactNode; // react component
    icon?: ReactNode; // antd icon
    isShow?: boolean; // dùng sau
    roles?: string[];
    isProtected?: boolean; // để đóng gói vào ProtectedRoute
    children?: AppRoute[];
}

export const ROUTER_CONFIG: AppRoute[] = [
    {
        path: '/',
        redirectTo: '/home',
        isShow: false,
    },
    {
        path: '/login',
        name: 'Login',
        element: <LoginPage/>,
        isShow: false,
    },
    {
        path: '/loginv2',
        name: 'Login V2',
        element: <LoginPageV2/>,
        isShow: false,
    },
    {
        path: '/register',
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
        isProtected: true,
    },
    {
        path: '/upload',
        name: 'Upload',
        element: <UploadPage/>,
        isProtected: true,
    },
    {
        path: '/profile',
        name: 'Profile',
        element: <UserProfilePage/>,
        isProtected: true,
    },
    {
        path: '/trash',
        name: 'Trash',
        element: <TrashPage/>,
        isProtected: true,
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
        element: <ImageReviewV2/>,
        isShow: false,
    },
    {
        path: '/projects',
        name: 'Projects',
        element: <ProjectMain/>,
        isShow: true,
    },
    {
        path: '/mockup/hls-video',
        name: 'Mockup HLS Video',
        element: <HlsVideoMockup/>,
        isShow: false,
    },
    {
        path: '/projects/:projectId',
        name: 'Project Assets',
        element: <FolderAsset/>,
        isProtected: true,
        isShow: false,
    }
];