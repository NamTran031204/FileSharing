/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {confirmable, type ConfirmDialog} from "react-confirm";
import React, {useMemo} from "react";
import {Button, Col, Modal, type ModalProps, Row} from "antd";
import {l} from "@plugin-core/shared/language/lang.utils";
import {DeleteOutlined, InfoCircleOutlined} from "@ant-design/icons";

export interface OrdConfirmProps {
    title?: React.ReactNode;
    content?: React.ReactNode;
    okLabel?: string;
    isDanger?: boolean;
    cancelLabel?: string;
    data?: any;
    onOk: (data: any) => Promise<void | boolean>;
    onCancel?: (data: any) => void;
    icon?: "default" | "remove" | React.ReactNode;
    modalProps?: ModalProps;
}

// eslint-disable-next-line react-refresh/only-export-components -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
const OrdConfirm: ConfirmDialog<OrdConfirmProps, boolean> = (props) => {
    const {modalProps} = props;
    const Footer = (
        <>
            <Button
                onClick={() => cancelClick()}
                className="btn-default custome-btn-default"
            >
                {props?.cancelLabel || l.transCommon("no")}
            </Button>
            <Button
                onClick={() => okClick()}
                type="primary"
                className="btn-primary custome-btn-primary"
                danger={props.isDanger}
            >
                {props?.okLabel || l.transCommon("yes")}
            </Button>
        </>
    );
    const okClick = async () => {
        const result = await props.onOk?.(props.data);

        if (result === false) {
            // Nếu false thì không đóng modal
            return;
        }
        // Nếu không phải false thì đóng modal
        props.proceed(true);
    };
    const cancelClick = () => {
        props.proceed(false);
        if (props.onCancel) {
            props.onCancel(props.data);
        }
    };
    const title = <div style={{fontSize: 22}}>{props.title}</div>;
    const renderIcon = useMemo(() => {
        const {icon} = props;
        if (icon === 'remove') {
            return <DeleteOutlined style={{fontSize: 80, color: "var(--color-destructive)"}}/>
        }
        if (icon === 'default') {
            return <InfoCircleOutlined style={{fontSize: 80, color: "var(--color-warning)"}}/>
        }
        return icon;
    }, [props?.icon]);
    return (
        <>
            <Modal
                open={props.show}
                closable={false}
                maskClosable={false}
                title={title}
                onCancel={cancelClick}
                footer={Footer}
                {...modalProps}
            >
                <Row align="middle">
                    <Col flex="0 1 100px" className="text-center">
                        {renderIcon}
                    </Col>
                    <Col
                        flex="1 1 200px"
                        style={{
                            fontSize: 20,
                            paddingLeft: 12,
                            paddingRight: 6,
                        }}
                    >
                        {props.content}
                    </Col>
                </Row>
            </Modal>
        </>
    );
};
// eslint-disable-next-line react-refresh/only-export-components -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
export default confirmable(OrdConfirm);
