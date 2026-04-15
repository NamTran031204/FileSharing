import {RightOutlined} from '@ant-design/icons';
import {Breadcrumb, type BreadcrumbProps} from 'antd';
import {useMemo} from 'react';
import {Link, matchPath, useLocation} from 'react-router-dom';
import type {AppRoute} from '../utils/RouterConfigUtil.tsx';

interface BreadCrumbNavigateProps {
    routes: AppRoute[];
    className?: string;
}

interface FlatRouteItem {
    path: string;
    name: string;
    redirectTo?: string;
    isShow?: boolean;
}

const normalizeRoutePath = (path: string) => {
    if (path.endsWith('/*')) {
        return path.slice(0, -2) || '/';
    }

    return path;
};

const getPathDepth = (path: string) => {
    const normalizedPath = normalizeRoutePath(path);

    if (normalizedPath === '/') {
        return 0;
    }

    return normalizedPath.split('/').filter(Boolean).length;
};

const resolveRouteTarget = (route: FlatRouteItem) => {
    if (route.redirectTo) {
        return route.redirectTo;
    }

    return normalizeRoutePath(route.path);
};

const flattenRoutes = (routes: AppRoute[]): FlatRouteItem[] => {
    const routeItems: FlatRouteItem[] = [];

    for (const route of routes) {
        if (route.path && route.name) {
            routeItems.push({
                path: route.path,
                name: route.name,
                redirectTo: route.redirectTo,
                isShow: route.isShow,
            });
        }

        if (route.children?.length) {
            routeItems.push(...flattenRoutes(route.children));
        }
    }

    return routeItems;
};

const BreadCrumbNav = ({routes}: BreadCrumbNavigateProps) => {
    const {pathname} = useLocation();

    const breadcrumbItems = useMemo<BreadcrumbProps['items']>(() => {
        const visibleRoutes = flattenRoutes(routes).filter((route) => route.isShow !== false);

        const matchedRoutes = visibleRoutes
            .filter((route) => matchPath({path: route.path, end: false}, pathname))
            .sort((leftRoute, rightRoute) => getPathDepth(leftRoute.path) - getPathDepth(rightRoute.path));

        const deduplicatedRoutes = matchedRoutes.filter(
            (route, routeIndex, routeList) => routeList.findIndex((item) => item.path === route.path) === routeIndex,
        );

        return deduplicatedRoutes.map((route, routeIndex) => {
            const isLastItem = routeIndex === deduplicatedRoutes.length - 1;
            const target = resolveRouteTarget(route);

            return {
                title: isLastItem ? (
                    <span className="text-sm font-semibold text-foreground">{route.name}</span>
                ) : (
                    <Link className="text-sm text-muted-foreground transition-colors hover:text-primary" to={target}>
                        {route.name}
                    </Link>
                ),
            };
        });
    }, [pathname, routes]);

    if (!breadcrumbItems || breadcrumbItems.length === 0) {
        return null;
    }

    return (
        <Breadcrumb
            separator={<RightOutlined className="text-[10px] text-muted-foreground"/>}
            items={breadcrumbItems}
        />
    );
};

export default BreadCrumbNav;
