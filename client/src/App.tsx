import {type ReactNode, useEffect, useState} from 'react';
import {BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate} from 'react-router-dom';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import BusyOverlay from "./components/core/common/BusyOverlay";
import AccessDeniedScreen from "./components/share/AccessDeniedScreen.tsx";
import {type AppRoute, ROUTER_CONFIG} from './utils/RouterConfigUtil.tsx';
import {rootStore} from './store';
import {tokenManager} from './api/baseApi.ts';

const normalizePath = (path: string) => {
    const trimmedPath = path.trim();

    if (!trimmedPath) {
        return '/';
    }

    const withLeadingSlash = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
    const normalizedPath = withLeadingSlash.replace(/\/{2,}/g, '/');

    if (normalizedPath === '/') {
        return '/';
    }

    return normalizedPath.endsWith('/') ? normalizedPath.slice(0, -1) : normalizedPath;
};

const resolveAbsolutePath = (routePath?: string, parentPath?: string) => {
    if (!routePath) {
        return undefined;
    }

    if (!parentPath || routePath.startsWith('/')) {
        return normalizePath(routePath);
    }

    return normalizePath(`${parentPath}/${routePath}`);
};

const flattenRoutes = (routes: AppRoute[], parentPath?: string): AppRoute[] => {
    const flattenedRoutes: AppRoute[] = [];

    for (const route of routes) {
        const absolutePath = resolveAbsolutePath(route.path, parentPath);

        flattenedRoutes.push({
            ...route,
            path: absolutePath,
            children: undefined,
        });

        if (route.children?.length) {
            flattenedRoutes.push(...flattenRoutes(route.children, absolutePath ?? parentPath));
        }
    }

    return flattenedRoutes;
};

const resolveRouteElement = (route: AppRoute) => {
    const baseElement = route.redirectTo
        ? <Navigate to={route.redirectTo} replace/>
        : route.element ?? null;

    if (!route.isPublic) {
        return <ProtectedRoute roles={route.roles}>{baseElement}</ProtectedRoute>;
    }

    return baseElement;
};

const renderRoute = (route: AppRoute, routeIndex: number) => {
    const routeKey = `${route.path ?? route.redirectTo ?? route.name ?? 'route'}-${routeIndex}`;

    return (
        <Route key={routeKey} path={route.path} element={resolveRouteElement(route)}/>
    );
};

// token het han / bi tu choi (401) thi baseApi/apiClient da xoa token, o day chuyen ve login
const UnauthorizedRedirect = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const onUnauthorized = () => {
            // het phien: bo user cu de lan dang nhap sau nap lai dung role
            rootStore.sessionStore.clearSession();
            navigate('/login', {replace: true});
        };
        window.addEventListener('auth:unauthorized', onUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
    }, [navigate]);

    return null;
};

// co token ma chua co user thi nap user hien tai (roles) vao sessionStore; chay lai khi doi trang
// nen cung bat duoc truong hop vua dang nhap xong va navigate
const SessionBootstrap = () => {
    const location = useLocation();

    useEffect(() => {
        const {sessionStore} = rootStore;
        if (tokenManager.isAuthenticated() && !sessionStore.user) {
            void sessionStore.loadCurrentUser();
        }
    }, [location.pathname]);

    return null;
};

// API tra ACCESS_DENIED (5701) thi thay trang dang mo bang man "Ban can quyen truy cap"; doi trang thi tu bo
const AccessDeniedGate = ({children}: {children: ReactNode}) => {
    const location = useLocation();
    const [deniedKey, setDeniedKey] = useState<string | null>(null);

    useEffect(() => {
        const onDenied = () => setDeniedKey(location.key);
        window.addEventListener('access:denied', onDenied);
        return () => window.removeEventListener('access:denied', onDenied);
    }, [location.key]);

    return deniedKey === location.key ? <AccessDeniedScreen/> : <>{children}</>;
};

const App = () => {
    const normalizedRoutes = flattenRoutes(ROUTER_CONFIG);

    return (
        <BrowserRouter>
            <UnauthorizedRedirect/>
            <SessionBootstrap/>
            <AccessDeniedGate>
                <Routes>{normalizedRoutes.map(renderRoute)}</Routes>
            </AccessDeniedGate>
            <ToastContainer />
            <BusyOverlay />
        </BrowserRouter>
    );
};

export default App;