/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import React from 'react';
import {CopyableWrapper} from '../utils/copyableWrapper';
import {StyleWrapper} from '../utils/styleWrapper';
import {NumberDisplay} from "@plugin-core/shared/common/display/NumberDisplay";
import {type NumberColumnOptions} from "../types";

export class NumberRender {
    static render(value: any, record: any, config: NumberColumnOptions): React.ReactNode {
        let num = typeof value === 'string' ? parseFloat(value) : value;
        if (config?.valueRender) {
            num = config.valueRender(record);
        }
        if (isNaN(num)) {
            return StyleWrapper.wrapWithStyle('', value, record, config);
        }
        if (config.hideZero && num === 0) {
            return StyleWrapper.wrapWithStyle('', value, record, config);
        }

        // Use NumberDisplay component for formatting
        const numberDisplay = (
            <NumberDisplay
                value={num}
                decimalPlaces={config.decimalPlaces}
                thousandSeparator={config.thousandSeparator}
                decimalSeparator={config.decimalSeparator}
                prefix={config.prefix}
                suffix={config.suffix}
                currency={config.currency}
                hideZero={config.hideZero}
                colorScheme={config.colorScheme} // Apply color scheme
                showTooltip={config.showTooltip}
                tooltipContent={config.tooltipContent}
            />
        );

        // Get formatted text for copying
        const formattedText = numberDisplay.props.children || String(value);

        const content = (
            <CopyableWrapper
                content={numberDisplay}
                copyText={formattedText}
                config={config}
            />
        );

        return StyleWrapper.wrapWithStyle(content, value, record, config);
    }
}
