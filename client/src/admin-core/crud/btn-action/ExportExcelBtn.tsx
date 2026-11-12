import {Button, Space} from "antd";
import {FileExcelOutlined} from "@ant-design/icons";
import {useTranslation} from "react-i18next";
import {throttle} from "lodash";


const ExportExcelBtn = (props: {
    disabled?: boolean;
    onClick: () => void;
}) => {
    const {t} = useTranslation('action');
    const onOkClick = () => {
        props.onClick();
    }
    const handlerClick = throttle(onOkClick, 1000);
    return (<>
        <Button onClick={handlerClick}
                disabled={props?.disabled}>
            <Space>
                <FileExcelOutlined/>
            </Space>
            {t('exportExcel')}
        </Button>
    </>);
}
export default ExportExcelBtn;
