import {type IActionBtn} from "./OrdCrudPage";
import {checkPermissionUser} from "@plugin-core/auth/utils/auth.utils";
import {useSessionStore} from "@plugin-core/shared/store/useSessionStore";
import AddNewEntity from "./btn-action/AddNewEntity";
import {Space} from "antd";
import ExportExcelBtn from "./btn-action/ExportExcelBtn";
import {useHotkeys} from "react-hotkeys-hook";
import {HotKeyScope} from "@plugin-core/shared/AppConst";

export const TopAction = (prop: {
    topActions?: IActionBtn[],
    hotkeyScope?: string
}) => {
    const appSession = useSessionStore(s => s.appSession);
    const clickDefault = (it: IActionBtn) => {
        if (it.onClick) {
            it.onClick();
        }
    }
    useHotkeys('F2', (event) => {
        if (prop.topActions) {
            prop.topActions.forEach(it => {
                if (it.title === 'addNew') {
                    clickDefault(it);
                }
            })
        }
        event.preventDefault();


    }, {scopes: [prop.hotkeyScope || HotKeyScope.crudPageBase], enableOnFormTags: true});
    return (
        <>
            {
                prop?.topActions &&
                prop.topActions.filter(it => {
                    return checkPermissionUser(appSession, it?.permission);
                }).map(it => {
                    if (it.title === 'addNew') {
                        return (<AddNewEntity onClick={() => clickDefault(it)}></AddNewEntity>);
                    }
                    if (it.title === 'exportExcel') {
                        return (<ExportExcelBtn onClick={() => clickDefault(it)}></ExportExcelBtn>);
                    }
                    return it?.content;
                }).map((it, idx) => {
                    return <Space key={idx} className="ord-top-action-item ms-2">{it}</Space>
                })
            }
        </>
    );
}
