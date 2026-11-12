import {Input, type InputProps} from "antd";
import * as React from "react";
import {useRef} from "react";
import useAutoFocus from "../hooks/useAutoFocus";

export interface IOrdInputRegexTextProp extends InputProps {
    regex: RegExp;
}

const OrdInputRegexText = (props: IOrdInputRegexTextProp) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const {value, onChange, autoFocus} = props;
    const focusRef = useAutoFocus();
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {value: inputValue} = e.target;
        if (props.regex.test(inputValue) || inputValue === '' || inputValue === '-') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
            // @ts-ignore
            onChange(inputValue);
        }
    };
    return (<>
        {/* eslint-disable-next-line react-hooks/rules-of-hooks -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */}
        <Input {...props} onChange={handleChange} ref={autoFocus ? focusRef : useRef(null)}/>
    </>);
}
export default OrdInputRegexText;
