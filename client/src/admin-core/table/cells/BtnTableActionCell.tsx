/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {useTranslation} from "react-i18next";
import {Button} from "antd";
import React from "react";
import {EyeOutlined} from "@ant-design/icons";
import {useSessionStore} from "@plugin-core/shared/store/useSessionStore";
import {checkPermissionUser} from "@plugin-core/auth/utils/auth.utils";

const BtnTableActionCell = (prop: {
    permission?: string;
    record?: any;
    hiddenIf?: (record: any) => boolean;
    callBackSuccess?: (data: any) => void;
    ns?: string;

}) => {
    const {t} = useTranslation(prop.ns ?? 'common');
    const appSession = useSessionStore(s => s.appSession);


    return (<>
        {prop?.callBackSuccess && <Button
            hidden={!checkPermissionUser(appSession, prop?.permission) || prop.hiddenIf && prop.hiddenIf(prop?.record || {})}
            title={t("actionBtn.view")}
            icon={<EyeOutlined/>}
            onClick={() => {
                if (prop?.callBackSuccess) prop?.callBackSuccess(prop.record);
            }}
        />}
    </>);
}
export default BtnTableActionCell;
