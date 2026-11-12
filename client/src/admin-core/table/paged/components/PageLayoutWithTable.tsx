/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import React, {useMemo} from 'react';
import {v4 as uuidv4} from "uuid";
import {Form, type FormInstance} from "antd";
import {TableSearchForm} from "./TableSearchForm";
import {type TableStoredState} from "../hooks/useTableStoreFactory";
import {type StoreApi, type UseBoundStore} from "zustand";
import {PageLayoutBase, type PageLayoutBaseProps} from "./PageLayoutBase";
import {TitleAndAction} from "@plugin-core/shared/common/page/TitleAndAction";
import {PageTopTitleAndAction} from "@plugin-core/shared/common/page/PageTopTitleAndAction";
import {TopAction} from "@plugin-core/crud/TopAction";

interface PageLayoutWithTableProps extends PageLayoutBaseProps {
    tableStore: UseBoundStore<StoreApi<TableStoredState>>;
    searchFields: React.ReactNode;
    searchInitData?: any;
    form?: FormInstance;
}

export const PageLayoutWithTable = ({
                                        topActions,
                                        titleHeader,
                                        topActionContent,
                                        hiddenHeader,
                                        children,
                                        searchFields,
                                        tableStore,
                                        searchInitData,
                                        form
                                    }: PageLayoutWithTableProps) => {
    const hotKeyScopeId = useMemo(() => `crudPageScope-${uuidv4()}`, []);
    const [internalForm] = Form.useForm();
    const usedForm = form || internalForm;
    return (
        <PageLayoutBase searchTitle titleHeader={titleHeader}
                        hiddenHeader={hiddenHeader}
                        hotKeyScopeId={hotKeyScopeId}>
            <div className={'ord-container-box ord-search-container'}>
                <TitleAndAction title={titleHeader ?? <PageTopTitleAndAction part="title"/>}>
                    {topActionContent}
                    <TopAction topActions={topActions} hotkeyScope={hotKeyScopeId}/>
                </TitleAndAction>
                <TableSearchForm form={usedForm} initialValues={searchInitData}
                                 layout='vertical' tableStore={tableStore}>
                    {searchFields}
                    <Form.Item hidden name={'hotKeyScopeId'} initialValue={hotKeyScopeId} noStyle/>
                </TableSearchForm>
            </div>
            <div className={'ord-container-box ord-crud-list ord-table-container'}>
                {children}
            </div>
        </PageLayoutBase>
    );
};
