/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import React from "react";

export const TitleAndAction = (props: {
    title: React.ReactNode;
    children?: any
}) => {
    return (<div
        className="flex flex-wrap items-end justify-between leading-[1.8571428571] mb-[13px] gap-y-[15px] gap-x-[12px] max-sm:flex-col">
        {props.title}
        <div className="flex items-center">
            {props?.children}
        </div>
    </div>);
}
