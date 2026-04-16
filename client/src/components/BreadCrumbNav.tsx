import {RightOutlined} from '@ant-design/icons';
import {Breadcrumb, type BreadcrumbProps} from 'antd';
import {useMemo} from 'react';
import {Link, matchPath, useLocation} from 'react-router-dom';
import type {AppRoute} from '../utils/RouterConfigUtil.tsx';

interface BreadCrumbNavigateProps {
    routes: AppRoute[];
    className?: string;
}

interface BreadcrumbRouteItem {
    path: string;
    name: string;
    redirectTo?: string;
    isShow?: boolean;
}

interface FlatRouteItem extends BreadcrumbRouteItem {
    ancestors: BreadcrumbRouteItem[];
}

const normalizeRoutePath = (path: string) => {
    const trimmedPath = path.trim();

    if (!trimmedPath) {
        return '/';
    }

    const withLeadingSlash = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
    const normalizedPath = withLeadingSlash.replace(/\/{2,}/g, '/');
    const pathWithoutWildcard = normalizedPath.endsWith('/*') ? normalizedPath.slice(0, -2) || '/' : normalizedPath;

    if (pathWithoutWildcard === '/') {
        return '/';
    }

    return pathWithoutWildcard.endsWith('/') ? pathWithoutWildcard.slice(0, -1) : pathWithoutWildcard;
};

const resolveAbsolutePath = (routePath?: string, parentPath?: string) => {
    if (!routePath) {
        return undefined;
    }

    if (!parentPath || routePath.startsWith('/')) {
        return normalizeRoutePath(routePath);
    }

    return normalizeRoutePath(`${parentPath}/${routePath}`);
};

const getPathDepth = (path: string) => {
    const normalizedPath = normalizeRoutePath(path);

    if (normalizedPath === '/') {
        return 0;
    }

    return normalizedPath.split('/').filter(Boolean).length;
};

const resolveRouteTarget = (route: BreadcrumbRouteItem) => {
    if (route.redirectTo) {
        return normalizeRoutePath(route.redirectTo);
    }

    return normalizeRoutePath(route.path);
};

const flattenRoutes = (
    routes: AppRoute[],
    parentPath?: string,
    ancestors: BreadcrumbRouteItem[] = [],
): FlatRouteItem[] => {
    const routeItems: FlatRouteItem[] = [];

    for (const route of routes) {
        const absolutePath = resolveAbsolutePath(route.path, parentPath);
        const currentRoute = absolutePath && route.name
            ? {
                path: absolutePath,
                name: route.name,
                redirectTo: route.redirectTo,
                isShow: route.isShow,
            }
            : undefined;

        if (currentRoute) {
            routeItems.push({
                ...currentRoute,
                ancestors,
            });
        }

        const nextAncestors = currentRoute ? [...ancestors, currentRoute] : ancestors;

        if (route.children?.length) {
            routeItems.push(...flattenRoutes(route.children, absolutePath ?? parentPath, nextAncestors));
        }
    }

    return routeItems;
};

const findActiveRoute = (routeItems: FlatRouteItem[], pathname: string) => {
    const matchedRoutes = routeItems.filter((route) => matchPath({path: route.path, end: false}, pathname));

    if (matchedRoutes.length === 0) {
        return undefined;
    }

    return matchedRoutes.sort((leftRoute, rightRoute) => {
        const depthDelta = getPathDepth(rightRoute.path) - getPathDepth(leftRoute.path);

        if (depthDelta !== 0) {
            return depthDelta;
        }

        return rightRoute.path.length - leftRoute.path.length;
    })[0];
};

const buildBreadcrumbChain = (activeRoute: FlatRouteItem): BreadcrumbRouteItem[] => {
    const breadcrumbChain = [...activeRoute.ancestors, activeRoute].filter((route) => route.isShow !== false);
    const deduplicatedRouteKeys = new Set<string>();

    return breadcrumbChain.filter((route) => {
        if (deduplicatedRouteKeys.has(route.path)) {
            return false;
        }

        deduplicatedRouteKeys.add(route.path);
        return true;
    });
};

const BreadCrumbNav = ({routes, className}: BreadCrumbNavigateProps) => {
    const {pathname} = useLocation();

    const breadcrumbItems = useMemo<BreadcrumbProps['items']>(() => {
        const routeItems = flattenRoutes(routes);
        const activeRoute = findActiveRoute(routeItems, pathname);

        if (!activeRoute || activeRoute.isShow === false) {
            return [];
        }

        const deduplicatedRoutes = buildBreadcrumbChain(activeRoute);

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
            className={className}
            separator={<RightOutlined className="text-[10px] text-muted-foreground"/>}
            items={breadcrumbItems}
        />
    );
};

export default BreadCrumbNav;
