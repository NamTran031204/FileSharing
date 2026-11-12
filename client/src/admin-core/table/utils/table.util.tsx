/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {type TableColumnsType} from "antd";
import TableActionCell, {type ITableAction} from "../cells/TableActionCell";
import {l} from "@plugin-core/shared/language/lang.utils";
import React from "react";
import {type ColumnType} from "antd/es/table/interface";

interface ColumnConfig<T> {
    ns?: string;
    widthRowIndexCol?: number;
    pinRowIndexCol?: boolean;
    widthActionCol?: number;
    actions?: ITableAction<T>[];
    viewAction?: (record: T) => void;
    viewActionPermission?: string
}

class TableUtil {
    getColumns<T>(
        columnBase: TableColumnsType,
        config?: ColumnConfig<T>,
        ignoreRowIndex = false
    ) {
        const ns = config?.ns || "field";
        let propColumns: ColumnType<any>[] = [
            {
                key: "rowIndex",
                title: l.transCommon("sttRow"),
                render: (_, record: any, idx) => <div>{record?.ordRowIndex ?? (idx + 1)}</div>,
                width: config?.widthRowIndexCol || 60,
                align: "center",
                fixed: config?.pinRowIndexCol ? "left" : undefined,
            },
            ...columnBase.map((it) => {
                let title = it.title;
                if (typeof title === "string") {
                    title = l.trans(ns + "." + title);
                }
                return {
                    ...it,
                    title,
                };
            }),
        ];
        if (ignoreRowIndex) {
            propColumns = propColumns.filter((x) => {
                if (ignoreRowIndex) {
                    return x.key != "rowIndex";
                }
                return true;
            });
        }
        if (config?.actions && config.actions.length > 0) {
            const many = config.actions.length > 1;
            propColumns.push({
                title: <span>{l.transCommon("action")}</span>,
                width: config.widthActionCol || (many ? 160 : 88),
                minWidth: config.widthActionCol || (many ? 160 : 88),
                fixed: "right",
                align: "center",
                ellipsis: false,
                onCell: () => ({style: {whiteSpace: "nowrap", overflow: "visible"}}),
                render: (_, record) => (
                    <TableActionCell actions={config.actions || []} ns={ns} record={record}/>
                ),
            });
        }
        return propColumns;
    }

    translateTitleColumns(columns: ColumnType[], ns: string) {
        ns = ns || "common";
        return columns.map((it) => {
            let title = it.title;
            if (typeof title === "string") {
                title = l.trans(ns + "." + title);
            }
            return {
                ...it,
                title,
            };
        });
    }
}

export default new TableUtil();
