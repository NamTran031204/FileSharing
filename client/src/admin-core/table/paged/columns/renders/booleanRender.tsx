/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import React from 'react';
import {CopyableWrapper} from '../utils/copyableWrapper';
import {StyleWrapper} from '../utils/styleWrapper';
import {type BooleanColumnOptions} from "../types";

export class BooleanRender {
    static render(value: any, record: any, config: BooleanColumnOptions): React.ReactNode {
        const {
            trueText = 'Có',
            falseText = 'Không',
            showIcon = true
        } = config;

        const isTrue = value === true || value === 'true' || value === 1;
        const text = isTrue ? trueText : falseText;
        const copyText = text;

        let displayContent: React.ReactNode;
        if (!showIcon) {
            displayContent = text;
        } else {
            // If no custom color config, use default boolean colors
            const defaultColor = isTrue ? 'success' : 'error';
            const colorConfig = (config.color ? config : { ...config, color: defaultColor }) as BooleanColumnOptions;

            displayContent = (
                <span>
          {showIcon && (isTrue ? '✓' : '✗')} {text}
        </span>
            );

            const content = (
                <CopyableWrapper
                    content={displayContent}
                    copyText={copyText}
                    config={config}
                />
            );

            return StyleWrapper.wrapWithStyle(content, value, record, colorConfig);
        }

        const content = (
            <CopyableWrapper
                content={displayContent}
                copyText={copyText}
                config={config}
            />
        );

        return StyleWrapper.wrapWithStyle(content, value, record, config);
    }
}
