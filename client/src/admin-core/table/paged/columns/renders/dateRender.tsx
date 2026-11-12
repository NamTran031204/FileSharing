/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import React from 'react';
import {CopyableWrapper} from '../utils/copyableWrapper';
import {StyleWrapper} from '../utils/styleWrapper';
import {DateDisplay} from "@plugin-core/shared/common/display/DateDisplay";
import {type DateColumnOptions} from "../types";

export class DateRender {
    static render(value: any, record: any, config: DateColumnOptions): React.ReactNode {
        const {
            showTooltip = true,
            tooltipFormat = "dddd, DD MMMM YYYY HH:mm:ss",
            colorScheme = "default",
        } = config;

        // Handle empty values at render level
        if (!value) {
            const emptyText = config.emptyText || '';
            const content = (
                <CopyableWrapper
                    content={emptyText}
                    copyText={emptyText}
                    config={config}
                />
            );
            return StyleWrapper.wrapWithStyle(content, value, record, config);
        }

        // Determine display mode
        let mode: 'date' | 'time' | 'datetime' = 'datetime';
        if (config.format) {
            if (config.format.includes('HH:mm') || config.format.includes('h:mm')) {
                mode = config.showTime !== false ? 'datetime' : 'time';
            } else {
                mode = 'date';
            }
        } else {
            mode = config.showTime !== false ? 'datetime' : 'date';
        }

        // Use DateDisplay component for formatting
        const dateDisplay = (
            <DateDisplay
                value={value}
                mode={mode}
                format={config.format}
                showTime={config.showTime}
                emptyText={config.emptyText}
                colorScheme={colorScheme}
                showTooltip={showTooltip}
                tooltipFormat={tooltipFormat}
            />
        );

        // Get formatted text for copying
        const copyText = dateDisplay.props.children || String(value);

        const content = (
            <CopyableWrapper
                content={dateDisplay}
                copyText={copyText}
                config={config}
            />
        );

        return StyleWrapper.wrapWithStyle(content, value, record, config);
    }
}
