import React, {useCallback, useMemo, useRef} from "react";
import {useTranslation} from "react-i18next";
import {Button, Col, Form, Input, Row, Space, Tooltip} from "antd";
import {useHotkeys} from "react-hotkeys-hook";
import {ZoomInOutlined, ZoomOutOutlined} from "@ant-design/icons";

import {type ISearchProp} from "./ISearchProp";
import useAutoFocus from "../hooks/useAutoFocus";
import {HotKeyScope} from "@plugin-core/shared/AppConst";
import {IconsaxRotateLeft, IconsaxSearchNormal} from "@plugin-core/shared/icon/IconsaxIcons";
import FloatLabel from "../float-label/index";
import {OrdButtonDebounced} from "@plugin-core/shared/common/btn/ButtonDebounced";

export interface ISearchFilterTextProps extends ISearchProp {
    onReset?: () => void;
    onSubmit?: () => void;
    hasAdvanceSearchBtn?: boolean;
    isHiddenAdvanceSearchBtnText?: boolean;
    ignoreAutoFocus?: boolean;
    placeHolder?: string;
    labelFilter?: string;
    iconSearchCustom?: React.ReactNode;
}

export const SearchFilterText: React.FC<ISearchFilterTextProps> = (props) => {
    const {
        hasAdvanceSearchBtn,
        isHiddenAdvanceSearchBtnText,
        placeHolder,
        iconSearchCustom,
        onReset,
        onSubmit,
        ignoreAutoFocus = false,
        labelFilter,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
        ...rest
    } = props;
    const {t} = useTranslation('form');
    const form = Form.useFormInstance();

    // Refs
    // eslint-disable-next-line react-hooks/rules-of-hooks -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const inputRef = ignoreAutoFocus ? useRef(null) : useAutoFocus();

    // Watch values
    const isShowAdvanceSearch = Form.useWatch('isShowAdvanceSearch', form);

    // Memoized values
    const searchPlaceholder = useMemo(() =>
            t(`searchTextPlaceholder.${placeHolder || 'common'}`),
        [t, placeHolder]
    );
    const filterLabel = useMemo(() =>
            labelFilter ?? t("filterSearch"),
        [labelFilter, t]
    );

    // Event handlers
    const handleReset = () => {
        onReset?.();
        if (form) {
            const currentValue = form.getFieldValue(['extendUI', 'onResetSearchParameter']) || 0;
            form.setFieldValue(['extendUI', 'onResetSearchParameter'], currentValue + 1);
        }
    }

    const handleSubmit = useCallback(() => {
        onSubmit?.();
    }, [onSubmit]);

    const handleAdvanceSearchToggle = useCallback(() => {
        form.setFieldValue('isShowAdvanceSearch', !isShowAdvanceSearch);
    }, [form, isShowAdvanceSearch]);


    // Hotkeys
    const hotkeyScope = useMemo(() =>
            form.getFieldValue('hotKeyScopeId') || HotKeyScope.crudPageBase,
        [form]
    );

    useHotkeys('F3', (event) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
        // @ts-ignore
        inputRef.current?.focus();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
        // @ts-ignore
        btnSearchRef.current?.click();
        event.preventDefault();
    }, {
        scopes: [hotkeyScope],
        enableOnFormTags: true
    });

    // Render advance search button content
    const renderAdvanceButtonContent = useCallback(() => {
        if (isHiddenAdvanceSearchBtnText) {
            return isShowAdvanceSearch ? <ZoomOutOutlined/> : <ZoomInOutlined/>;
        }
        return isShowAdvanceSearch ? t('hiddenSearchAdvance') : t('showSearchAdvance');
    }, [isHiddenAdvanceSearchBtnText, isShowAdvanceSearch, t]);

    const advanceButtonTitle = useMemo(() => {
        if (!isHiddenAdvanceSearchBtnText) return "";
        return isShowAdvanceSearch ? t('hiddenSearchAdvance') : t('showSearchAdvance');
    }, [isHiddenAdvanceSearchBtnText, isShowAdvanceSearch, t]);

    // Render search icon
    const searchIcon = useMemo(() =>
            iconSearchCustom || <IconsaxSearchNormal style={{fontSize: 24}}/>,
        [iconSearchCustom]
    );

    return (
        <>
            <Row className="ord-search-keyword" align="top" wrap={false}>
                <Col flex="1 1 150px">
                    <FloatLabel label={filterLabel}>
                        <Space.Compact style={{width: '100%'}}>
                            <Tooltip placement="topLeft" title={searchPlaceholder}>
                                <Form.Item name="filter" className="flex-auto">
                                    <Input ref={inputRef}
                                           prefix={<IconsaxSearchNormal style={{fontSize: 20, color: 'var(--vtt-text-secondary)'}}/>}
                                           placeholder={searchPlaceholder}
                                           allowClear
                                    />
                                </Form.Item>
                            </Tooltip>
                        </Space.Compact>
                    </FloatLabel>
                </Col>

                <Col flex="none">
                    <Space size={16}>
                        <Tooltip placement="top" title={t('refreshDataTable')}>
                            <OrdButtonDebounced
                                aria-label={t('refreshDataTable')}
                                onClick={handleReset}
                                delay={300}
                                className="btn-other"
                                type="default"
                                style={{width: 'var(--vtt-control-height)'}}
                                icon={<IconsaxRotateLeft style={{fontSize: 24}}/>}
                            />
                        </Tooltip>

                        <Tooltip placement="top" title={t('search')}>
                            <OrdButtonDebounced
                                aria-label={t('search')}
                                type="primary"
                                htmlType={onSubmit ? 'button' : 'submit'}
                                className="search-btn"
                                onClick={handleSubmit}
                                delay={300}
                                icon={searchIcon}
                            />
                        </Tooltip>

                        {hasAdvanceSearchBtn && (
                            <Button
                                className="btn-other"
                                type="default"
                                title={advanceButtonTitle}
                                onClick={handleAdvanceSearchToggle}
                            >
                                {renderAdvanceButtonContent()}
                            </Button>
                        )}
                    </Space>
                </Col>
            </Row>
            {/* Hidden form fields */}
            <Form.Item noStyle name="isShowAdvanceSearch" initialValue={false} hidden/>
        </>
    );
};
