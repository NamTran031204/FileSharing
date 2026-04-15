import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import {type AppRoute, ROUTER_CONFIG} from './utils/RouterConfigUtil.tsx';

const resolveRouteElement = (route: AppRoute) => {
    const baseElement = route.redirectTo
        ? <Navigate to={route.redirectTo} replace/>
        : route.element ?? null;

    if (route.isProtected) {
        return <ProtectedRoute>{baseElement}</ProtectedRoute>;
    }

    return baseElement;
};

const renderRoute = (route: AppRoute) => {
    const routeKey = route.path ?? route.redirectTo ?? route.name ?? 'route';

    return (
        <Route key={routeKey} path={route.path} element={resolveRouteElement(route)}>
            {route.children?.map(renderRoute)}
        </Route>
    );
};

const App = () => {
    return (
        <BrowserRouter>
            <Routes>{ROUTER_CONFIG.map(renderRoute)}</Routes>
        </BrowserRouter>
    );
};

export default App;