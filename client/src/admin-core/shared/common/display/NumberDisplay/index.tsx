import React from 'react';
import {Skeleton, Tooltip} from 'antd';
import {type NumberDisplayProps, NumberFormatUtils} from './types';

export const NumberDisplay: React.FC<NumberDisplayProps> = ({
                                                                value,
                                                                className = '',
                                                                style = {},
                                                                showSign = false,
                                                                showPercentage = false,
                                                                abbreviate = false,
                                                                colorScheme = 'default',
                                                                showTooltip = false,
                                                                tooltipContent,
                                                                loading = false,
                                                                skeleton = false,
                                                                hideZero = false,
                                                                ...config
                                                            }) => {
    // Handle loading state
    if (loading || skeleton) {
        return <Skeleton.Input active size="small" style={{width: 60, ...style}}/>;
    }

    // Handle empty values
    if (value === null || value === undefined || value === '') {
        return <span className={className} style={style}>--</span>;
    }

    // Parse number
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) {
        return <span className={className} style={style}>--</span>;
    }

    // Handle hideZero
    if (hideZero && num === 0) {
        return <span className={className} style={style}>--</span>;
    }

    // Format number
    let formatted: string;

    if (abbreviate) {
        formatted = NumberFormatUtils.abbreviateNumber(num);
    } else {
        formatted = NumberFormatUtils.formatNumber(num, config);
    }

    // Add sign
    if (showSign) {
        formatted = NumberFormatUtils.formatWithSign(num, formatted);
    }

    // Add percentage
    if (showPercentage && !config.suffix && !config.currency) {
        formatted += '%';
    }

    // Apply color scheme
    const color = NumberFormatUtils.getValueColor(num, colorScheme);
    const finalStyle: React.CSSProperties = {
        color,
        fontVariantNumeric: 'tabular-nums', // Monospace numbers
        ...style
    };

    const displayElement = (
        <span
            className={`number-display ${className}`}
            style={finalStyle}
            title={showTooltip ? undefined : String(value)} // Fallback tooltip
        >
      {formatted}
    </span>
    );

    // Wrap with tooltip if needed
    if (showTooltip && tooltipContent) {
        return (
            <Tooltip title={tooltipContent}>
                {displayElement}
            </Tooltip>
        );
    }

    return displayElement;
};