import {useTranslation} from "react-i18next";
import './StatusCell.scss';
import {IsActiveStatusDisplay} from "@plugin-core/shared/common/display/Status/IsActiveStatusDisplay";

export const StatusCell = (prop: {
    isActived?: boolean,
    trueText?: string,
    falseText?: string,
}) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const {t} = useTranslation('common');
    return (<IsActiveStatusDisplay value={prop?.isActived} config={{
        activeText: prop?.trueText || 'dang_hoat_dong',
        inactiveText: prop?.falseText || 'ngung_hoat_dong',
    }}/>);
}
