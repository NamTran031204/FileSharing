import {useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import {getFlatMenu, removePrefixDefault} from '@plugin-core/shared/menu/menuRegistry';

const lowerFirst = (text: string): string => {
    if (!text) return text;
    return text.charAt(0).toLowerCase() + text.slice(1);
};

export const useAutoListTitle = () => {
    const {t} = useTranslation('menu');
    const pathname = typeof window === 'undefined' ? '' : window.location.pathname;

    return useMemo(() => {
        const currentPath = removePrefixDefault(pathname);
        const matchedNode = getFlatMenu().find(x => x.path === currentPath);
        if (!matchedNode) return undefined;
        return `${t('common:list')} ${lowerFirst(t(matchedNode.title))}`;
    }, [pathname, t]);
};
