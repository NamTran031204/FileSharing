import {useTranslation} from 'react-i18next';
import {TitleAndAction} from './TitleAndAction';
import {getFlatMenu} from '../../menu/menuRegistry';

export const PageTopTitleAndAction = (props: {
    children?: React.ReactNode;
    usingCustom?: boolean;
    mainTitle?: string;
    items?: string[];
    part?: 'trail' | 'title';
}) => {
    const {t} = useTranslation();
    const node = getFlatMenu().find(x => x.path === window.location.pathname);
    const title = props.usingCustom ? props.mainTitle : node ? t(node.title) : undefined;
    return (
        <TitleAndAction title={<h2 className="m-0 text-lg font-semibold text-foreground">{props.part === 'trail' ? null : title}</h2>}>
            {props.children}
        </TitleAndAction>
    );
};
