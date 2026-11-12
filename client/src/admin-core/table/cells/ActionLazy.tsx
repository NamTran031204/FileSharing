/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import React from "react";
import {Space} from "antd";

type Props = {
    record: any,
    title: string,
    callBackSuccess?: (data: any) => void;
}

export abstract class ActionLazy extends React.Component<Props> {
    record: any;

    componentDidMount() {
        this.record = this.props.record;
    }

    render() {
        return <div onClick={() => this.onClick(this.props.record)}>
            <Space>{this.icon()}{this.props.title}</Space>
        </div>;
    }

    callBackSuccess() {
        if (this.props.callBackSuccess) {
            this.props.callBackSuccess(this.record);
        }
    }

    abstract icon(): React.ReactNode;

    abstract onClick(record: any): void;
}
