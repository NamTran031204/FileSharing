/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */

import {type SelectDataSource} from "@plugin-core/form/select/data-source/selectDataSource";
import {useMemo} from "react";

export interface UseSelectDisplayTextProps {
    datasource: SelectDataSource;
    value: any;
    renderDisplay?: (option: any) => React.ReactNode;
}

// eslint-disable-next-line react-refresh/only-export-components -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
export const useSelectDisplayText = ({
                                         datasource,
                                         value,
                                         renderDisplay,
                                     }: UseSelectDisplayTextProps) => {
    const options = useMemo(() => {
        return datasource.data || [];
    }, [datasource]);

    const displayText = useMemo(() => {
        if (!value) return null;

        if (options.length > 0) {
            const f = options.find((x) => x.value == value);
            if (!f) return null;
            return renderDisplay ? renderDisplay(f) : f.label;
        }
        return null;
    }, [options, value, renderDisplay]);

    return {options, displayText};
};

const DisplayTextFormSelectDataSource = (props: {
    datasource: SelectDataSource;
    value: any;
    renderDisplay?: (option: any) => React.ReactNode;
}) => {
    const {displayText} = useSelectDisplayText(props);
    return <span>{displayText}</span>;
};
export default DisplayTextFormSelectDataSource;
