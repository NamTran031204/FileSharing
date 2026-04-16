import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import {type AppRoute, ROUTER_CONFIG} from './utils/RouterConfigUtil.tsx';

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

    if (route.isProtected) {
        return <ProtectedRoute>{baseElement}</ProtectedRoute>;
    }

    return baseElement;
};

const renderRoute = (route: AppRoute, routeIndex: number) => {
    const routeKey = `${route.path ?? route.redirectTo ?? route.name ?? 'route'}-${routeIndex}`;

    return (
        <Route key={routeKey} path={route.path} element={resolveRouteElement(route)}/>
    );
};

const App = () => {
    const normalizedRoutes = flattenRoutes(ROUTER_CONFIG);

    return (
        <BrowserRouter>
            <Routes>{normalizedRoutes.map(renderRoute)}</Routes>
        </BrowserRouter>
    );
};

export default App;