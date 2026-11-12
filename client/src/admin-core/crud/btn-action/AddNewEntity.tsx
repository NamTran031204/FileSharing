/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {Button, Space} from "antd";
import {PlusOutlined} from "@ant-design/icons";
import {type MouseEventHandler, type ReactNode, useMemo} from "react";
import {l} from "@plugin-core/shared/language/lang.utils";


const AddNewEntity = (props: {
    disabled?: boolean;
    onClick?: MouseEventHandler<any> | undefined;
    title?: ReactNode
}) => {
    const title = useMemo(() => {
        if (props.title) {
            return props.title;
        }
        return <span>{l.trans('action.addNew')}</span>
    }, [props.title]);
    return (<>
        <Button type='primary'
                onClick={props?.onClick}
                disabled={props?.disabled}>
            <Space>
                <PlusOutlined/>
            </Space>
            {title}
        </Button>
    </>);
}
export default AddNewEntity;
