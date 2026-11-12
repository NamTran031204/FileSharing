// components/PageLayoutBase.tsx
import {type IActionBtn} from "@plugin-core/crud/types";
import {useMemo} from "react";
import {TopAction} from "@plugin-core/crud/TopAction";
import {TitleAndAction} from "@plugin-core/shared/common/page/TitleAndAction";
import {PageTopTitleAndAction} from "@plugin-core/shared/common/page/PageTopTitleAndAction";
import {HotkeysProvider} from "react-hotkeys-hook";
import {v4 as uuidv4} from "uuid";

export interface PageLayoutBaseProps {
    children: React.ReactNode;
    titleHeader?: React.ReactNode | string;
    topActions?: IActionBtn[];
    topActionContent?: React.ReactNode;
    hiddenHeader?: boolean;
    hotKeyScopeId?: string;
    searchTitle?: boolean;
}

// Component con thực sự sử dụng context
export const PageLayoutBase: React.FC<PageLayoutBaseProps> = ({
                                                                  children,
                                                                  titleHeader,
                                                                  topActions,
                                                                  topActionContent,
                                                                  hiddenHeader,
                                                                  hotKeyScopeId: internalHotKeyScopeId,
                                                                  searchTitle
                                                              }) => {
    const hotKeyScopeId = useMemo(() => {
        if (!internalHotKeyScopeId) {
            return `crudPageScope-${uuidv4()}`;
        }
        return internalHotKeyScopeId;
    }, [internalHotKeyScopeId]);

    const RightActionGroups = (
        <>
            {topActionContent}
            <TopAction topActions={topActions} hotkeyScope={hotKeyScopeId}/>
        </>
    );

    const renderHeader = useMemo(() => {
        if (hiddenHeader) return null;
        if (titleHeader) {
            return (
                <TitleAndAction title={titleHeader}>
                    {RightActionGroups}
                </TitleAndAction>
            );
        }
        if (searchTitle) {
            return <PageTopTitleAndAction part="trail"/>;
        }
        return <PageTopTitleAndAction>{RightActionGroups}</PageTopTitleAndAction>;
    }, [titleHeader, hiddenHeader, RightActionGroups, searchTitle]);

    return (
        <HotkeysProvider initiallyActiveScopes={[hotKeyScopeId]}>
            <div className="ord-page-shell">
                <div className="ord-page-header">{renderHeader}</div>
                <div className="ord-page-container">{children}</div>
            </div>
        </HotkeysProvider>
    );
};
