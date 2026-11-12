/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {Button} from "antd"
import {useMemo} from "react";
import {type BaseButtonProps} from "antd/es/button/Button";
import UiUtils from "@plugin-core/shared/utils/ui.utils";
import {OrdTransConfirm} from "@plugin-core/shared/common/translation/OrdTransConfirm";

interface IProps {
    selectedRowKeys: string[];
    buttonProps?: BaseButtonProps;
    titleButton?: string;
    children?: any;
    isHiddenIfEmpty?: boolean;
    confirm?: {
        title?: React.ReactNode;
        titleI18nKey?: string;
        content?: React.ReactNode;
        contentI18nKey?: string;
        icon?: "default" | "remove" | React.ReactNode;
    },
    handlerClick: (selectedRowKeys: string[]) => void;
}

export const BulkActionButtonModal: React.FC<IProps> = (props) => {

    const {
        handlerClick,
        selectedRowKeys,
        buttonProps = {
            type: 'primary'
        },
        titleButton,
        children,
        isHiddenIfEmpty = false,
        confirm
    } = props;
    const selectedCount = useMemo(() => {
        return (selectedRowKeys || []).length;
    }, [selectedRowKeys]);
    const onClick = () => {
        if (confirm) {
            const {
                title: confirmTitle,
                titleI18nKey,
                content: confirmContent,
                icon = 'remove',
                contentI18nKey
            } = confirm;
            UiUtils.showConfirm({
                title: titleI18nKey ? <OrdTransConfirm
                    ns={'confirm'}
                    i18nKey={titleI18nKey}
                /> : confirmTitle,
                icon: icon,
                content: contentI18nKey ? <OrdTransConfirm
                    ns={'confirm'}
                    i18nKey={contentI18nKey}
                    values={{
                        selectedCount,
                        count: selectedCount
                    }}
                /> : confirmContent,
                onOk: () => {
                    handlerClick(selectedRowKeys);
                }
            });
            return;
        }
        handlerClick(selectedRowKeys);
    }
    if (isHiddenIfEmpty && selectedCount <= 0) {
        return null;
    }
    return <>
        <Button {...buttonProps} disabled={selectedCount === 0} onClick={onClick}>
            {titleButton ? <OrdTransConfirm
                ns={'action'}
                i18nKey={titleButton}
                values={{
                    selectedCount
                }}
            /> : children}
        </Button>
    </>

}
