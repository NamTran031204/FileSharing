/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */

import {Select} from "antd";
import * as React from "react";
import {type MutableRefObject, useEffect, useRef, useState} from "react";
import type {BaseOptionType, DefaultOptionType} from "@rc-component/select/lib/Select";
import Utils from "@plugin-core/shared/utils/utils";
import {type SelectDataSource} from "@plugin-core/form/select/data-source/selectDataSource";
import {useTranslation} from "react-i18next";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
import {type RenderNode} from "../model/ICommonInputProp";
import type {FlattenOptionData} from "@rc-component/select/lib/interface";
import {type SelectProps} from "antd/es/select";
import useAutoFocus from "../hooks/useAutoFocus";

export interface IOrdSelectProp extends IBaseOrdSelectProp {
    datasource: SelectDataSource;
    autoFocus?: boolean;
    onSelectRefReady?: (selectRef: MutableRefObject<any>) => void;
}

export interface IBaseOrdSelectProp extends SelectProps<any, any> {
    placeholder?: React.ReactNode;
    disabled?: boolean;
    loading?: boolean;
    onChange?: (
        value: any,
        option?: IOrdSelectOption | IOrdSelectOption[]
    ) => void;
    defaultValue?: any | null;
    mode?: "multiple" | "tags";
    value?: any;
    newOption?: IOrdSelectOption;
    allowClear?:
        | boolean
        | {
        clearIcon?: React.ReactNode;
    };
    dropdownRender?: (menu: React.ReactElement) => React.ReactElement;
    optionRender?: (
        oriOption: FlattenOptionData<any>,
        info: {
            index: number;
        }
    ) => React.ReactNode;

    [key: string]: any
}

export interface IOrdSelectOption extends BaseOptionType {
    label?: React.ReactNode;
    value?: string | number | boolean | null;
    disable?: boolean;
    children?: Omit<DefaultOptionType, "children">[];
    fts?: string | string[] | null;
}

const OrdSelect = (props: IOrdSelectProp) => {
    const [options, setOptions] = useState<IOrdSelectOption[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const [value, setValue] = useState<any>(null);
    const {newOption, ...rest} = props;
    const onSearchOption = (input: any, option?: IOrdSelectOption) => {
        const fts = option?.fts;
        const ftsStr = Array.isArray(fts) ? fts.join(" ") : fts || "";
        return ftsStr
            .toLowerCase()
            .includes(Utils.toLowerCaseNonAccentVietnamese(input.trim().toLowerCase()));
    };
    const {t} = useTranslation();
    useEffect(() => {
        setOptions(props.datasource.data || []);
        setLoading(props.datasource.isPending || false);
    }, [props.datasource.data, props.datasource.isPending]);
    useEffect(() => {
        if (newOption && newOption.value) {
            setOptions((prevOptions) => {
                if (!prevOptions.some((opt) => opt.value === newOption.value)) {
                    return [newOption, ...prevOptions];
                }
                return prevOptions;
            });
        }
    }, [newOption]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const selectRef = useRef<any>(null);
    const focusRef = useAutoFocus();
    return (
        <Select
            // eslint-disable-next-line react-hooks/rules-of-hooks -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
            ref={props.autoFocus ? focusRef : useRef(null)}
            className={"w-full " + props?.className}
            {...rest}
            allowClear={props.allowClear != false}
            placeholder={props.placeholder || t("filterSelectCommonPlaceholder")}
            options={options}
            loading={loading}
            showSearch
            filterOption={(input, option) => onSearchOption(input, option)}
        />
    );
};
export default OrdSelect;
