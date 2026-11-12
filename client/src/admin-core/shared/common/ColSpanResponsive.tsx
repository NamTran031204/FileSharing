/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {useResponsiveSpan} from "@plugin-core/shared/hooks/useResponsiveSpan";
import React from "react";
import {Col} from "antd";

export const ColSpanResponsive = (props: {
    span: number,
    children: any,
    className?: string | undefined;
}) => {
    const {span, children, ...rest} = props;
    const spanRep = useResponsiveSpan(span);
    return <Col {...rest} {...spanRep}  >
        {children}
    </Col>
}
