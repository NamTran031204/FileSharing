/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import React from 'react';
import {CopyableWrapper} from '../utils/copyableWrapper';
import {StyleWrapper} from '../utils/styleWrapper';
import {EllipsisText} from "@plugin-core/shared/common/display/EllipsisText";
import {type TextColumnOptions} from "../types";

export class TextRender {
    static render(
        value: any,
        record: any,
        config: TextColumnOptions
    ): React.ReactNode {
        if (value === null || value === undefined) {
            return StyleWrapper.wrapWithStyle('', value, record, config);
        }

        const text = String(value);
        const {maxLines = 2} = config;


        const textContent = <EllipsisText text={text}  maxLines={maxLines}/>

        const content = (
            <CopyableWrapper
                content={textContent}
                copyText={text}
                config={config}
            />
        );

        return StyleWrapper.wrapWithStyle(content, value, record, config);
    }
}
