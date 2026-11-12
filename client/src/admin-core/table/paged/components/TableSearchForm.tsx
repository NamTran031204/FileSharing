import React from 'react';
import {Form, type FormInstance, type FormProps, Row} from 'antd';
import type {StoreApi, UseBoundStore} from 'zustand';
import {type TableStoredState} from "../hooks/useTableStoreFactory";
import {useTableSearchForm} from "../hooks/useTableSearchForm";

export interface TableSearchFormProps extends FormProps {
    tableStore: UseBoundStore<StoreApi<TableStoredState>>;
    children: React.ReactNode;
    form?: FormInstance;
}

export const TableSearchForm: React.FC<TableSearchFormProps> = ({
                                                                    form,
                                                                    tableStore,
                                                                    children,
                                                                    ...restProps
                                                                }) => {
    const [internalForm] = Form.useForm();
    const usedForm = form || internalForm;
    const {handleSearch} = useTableSearchForm(
        usedForm,
        tableStore,
        restProps.initialValues
    );
    return (
        <div className={'crud-search-box ord-search-panel'}>
            <Form
                form={usedForm}
                layout="vertical"
                onFinish={handleSearch}
                onReset={handleSearch}
                {...restProps}
            >
                <SearchFormExtendUi/>
                <Row className="ord-search-row" gutter={[16, 16]} align="top">
                    {children}
                </Row>
            </Form>
        </div>

    );
};


export const SearchFormExtendUi = () => {
    return <>
        {/* Signal fields */}
        <Form.Item noStyle name={['extendUI', 'onResetSearchParameter']} initialValue={0}/>
        <Form.Item noStyle name={['extendUI', 'onLoadDataTable']} initialValue={0}/>
        <Form.Item noStyle name={['extendUI', 'reloadStatusCounter']} initialValue={0}/>
    </>;
}
