import {useTranslation} from "react-i18next";
import {Col, Form} from "antd";
import React from "react";
import OrdSelect from "../select/OrdSelect";
import {useSelectIsActived} from "@plugin-core/form/select/data-source/useSelectIsActived";
import {type ISearchProp} from "./ISearchProp";
import {useResponsiveSpan} from "@plugin-core/shared/hooks/useResponsiveSpan";
import FloatLabel from "../float-label/index";

export const SearchIsActived = (props: ISearchProp) => {
    const {t} = useTranslation('common');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    // @ts-ignore
    return (<>
        <Col {...props} {...useResponsiveSpan(props?.span || 4)}>
            <FloatLabel label={t('filterIsActived')}>
                <Form.Item name='isActived'>
                    <OrdSelect datasource={useSelectIsActived()} allowClear
                               placeholder={t('filterSelectCommonPlaceholder')}/>
                </Form.Item>
            </FloatLabel>

        </Col>
    </>);
}
