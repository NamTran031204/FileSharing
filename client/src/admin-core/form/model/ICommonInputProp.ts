/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import * as React from "react";

export type RenderNode = React.ReactNode | ((props: any) => React.ReactNode);

export interface ICommonInputProp<TValue> {
    id?: string;
    value?: TValue;
    onChange?: (v?: any) => void;
    placeholder?: string;
    disabled?: boolean;
    allowClear?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
export interface ICommonInputAnyProp extends ICommonInputProp<any> {

}



