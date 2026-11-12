/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {Button, Dropdown, type MenuProps, Space} from "antd";
import React, {useMemo} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {useSessionStore} from "@plugin-core/shared/store/useSessionStore";
import {checkPermissionUser} from "@plugin-core/auth/utils/auth.utils";
import {IconsaxEdit2, IconsaxEye, IconsaxMoreVertical} from "@plugin-core/shared/icon/IconsaxIcons";
import {type BaseButtonProps} from "antd/es/button/Button";
import {l} from "@plugin-core/shared/language/lang.utils";
import './TableActionCell.scss';

export interface ITableAction<TDto> {
    title: 'view' | 'edit' | 'remove' | string;
    icon?: React.ReactNode,
    onClick?: (record: TDto) => void;
    permission?: string;
    hiddenIf?: (record: any) => boolean;
    content?: (record: any) => React.ReactNode;
    contentLazy?: any;
    callBackSuccess?: (data: any) => void;
    isDanger?: boolean;
    singletonButtonProps?: BaseButtonProps
}

export const TableActionIcon = (props: {
    title: 'view' | 'edit' | 'remove' | string;
    icon?: React.ReactNode;
}) => {
    const {title, icon} = props;
    const ICON_DEFAULT: any = {
        'view': <IconsaxEye style={{fontSize: 20}}/>,
        edit: <IconsaxEdit2 style={{fontSize: 20}}/>,
        remove: <DeleteOutlined style={{fontSize: 20}}/>
    }
    if (icon) {
        return <>{icon}</>
    }
    return ICON_DEFAULT[title];
}
export const TableActionTitle = (props: {
    title: 'view' | 'edit' | 'remove' | string
}) => {
    const title = useMemo(() => {
        return l.trans('action.' + props.title);
    }, [props]);
    return <>{title}</>;
}

const TableActionCell = (prop: {
    actions: ITableAction<any>[],
    ns?: string,
    record?: any
}) => {

    const appSession = useSessionStore(s => s.appSession);
    const visible = prop.actions.filter(it => {
        if (it.hiddenIf && it.hiddenIf(prop?.record || {})) {
            return false;
        }
        return checkPermissionUser(appSession, it?.permission);
    });
    const INLINE = ['view', 'edit'];
    const inline = visible.filter(it => INLINE.includes(it.title) && !it.content && !it.contentLazy);
    const menu = visible.filter(it => !inline.includes(it));
    const items: MenuProps['items'] = menu.map((it, idx) => {
        const icon = (<TableActionIcon {...it}/>);
        const title = (<TableActionTitle {...it}/>);
        const isDanger = it.isDanger || it.title === 'remove';
        const defaultIconAndLabelContent = <Space wrap>
            {icon}
            {title}
        </Space>;
        if (it.contentLazy) {
            return {
                key: '' + idx,
                label: <it.contentLazy title={title}
                                       record={prop.record}
                                       callBackSuccess={it.callBackSuccess}/>,
                onClick: () => {
                    if (it.onClick) {
                        it.onClick(prop?.record);
                    }
                },
            };
        }
        if (it.content) {
            const contentWithRecord = it.content(prop.record);
            return {
                key: '' + idx,
                label: <>{defaultIconAndLabelContent} {contentWithRecord}</>,
                onClick: () => {
                    if (it.onClick) {
                        it.onClick(prop?.record);
                    }
                },
                danger: isDanger
            };
        }

        return {
            key: '' + idx,
            label: (
                <Space wrap>{icon} {title}</Space>
            ),
            onClick: () => {
                if (it.onClick) {
                    it.onClick(prop?.record);
                }
            },
            danger: isDanger
        };
    });
    return (
        <span className="ord-table-action-cell">
            {inline.map((it, idx) => (
                <Button key={idx} type="text" className="ord-table-action-icon"
                        aria-label={l.trans('action.' + it.title)}
                        icon={<TableActionIcon {...it}/>}
                        onClick={() => it.onClick?.(prop?.record)}/>
            ))}
            {menu.length > 0 ? <Dropdown menu={{items}} trigger={['click']}>
                <Button type="text" className="ord-table-action-trigger"
                        aria-label={l.trans('action.more')}
                        aria-haspopup="menu"
                        icon={<IconsaxMoreVertical/>}>
                </Button>
            </Dropdown> : null}
        </span>
    );
}
export default TableActionCell;
