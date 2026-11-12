/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {StatusCell} from "../cells/StatusCell";
import React from "react";
import {type ColumnType} from "antd/es/table/interface";
import {l} from "@plugin-core/shared/language/lang.utils";

export const IsActivedColumn = (width = 120) => {
    return {
        title: l.transCommon('status'),
        dataIndex: 'isActived',
        render: (_: any, record: any) => (< StatusCell isActived={record.isActived}/>),
        width: width,
        align: 'center'
    } as ColumnType;
};
