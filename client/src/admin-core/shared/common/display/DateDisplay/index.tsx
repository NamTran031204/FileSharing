import React from 'react';
import {Skeleton, Tooltip} from 'antd';
import {CalendarOutlined, ClockCircleOutlined} from '@ant-design/icons';
import {type DateDisplayProps} from './types';
import {DateFormatUtils} from './utils';

export const DateDisplay: React.FC<DateDisplayProps> = ({
                                                            value,
                                                            className = '',
                                                            style = {},
                                                            mode = 'datetime',
                                                            colorScheme = 'default',
                                                            deadlineDate,
                                                            showTooltip = false,
                                                            tooltipContent,
                                                            tooltipFormat,
                                                            loading = false,
                                                            skeleton = false,
                                                            showIcon = false,
                                                            icon,
                                                            emptyText = '--',
                                                            invalidText = 'Invalid Date',
                                                            ...config
                                                        }) => {
    // Handle loading state
    if (loading || skeleton) {
        return <Skeleton.Input active size="small" style={{width: 100, ...style}}/>;
    }

    // Handle empty values
    if (!value) {
        return <span className={className} style={style}>{emptyText}</span>;
    }

    // Validate date
    if (!DateFormatUtils.isValidDate(value)) {
        return <span className={className} style={style}>{invalidText}</span>;
    }

    // Format date based on mode
    let formatted: string;
    let defaultTooltip: string;

    switch (mode) {
        case 'date':
            formatted = DateFormatUtils.formatDate(value, config.format || 'DD/MM/YYYY');
            defaultTooltip = DateFormatUtils.formatDate(value, 'dddd, DD MMMM YYYY');
            break;

        case 'time':
            formatted = DateFormatUtils.formatDate(value, config.format || 'HH:mm');
            defaultTooltip = DateFormatUtils.formatDate(value, 'HH:mm:ss');
            break;

        case 'datetime':
            // eslint-disable-next-line no-case-declarations -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
            const timeFormat = config.showSeconds ? 'HH:mm:ss' : 'HH:mm';
            // eslint-disable-next-line no-case-declarations -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
            const defaultFormat = config.showTime !== false
                ? `DD/MM/YYYY ${timeFormat}`
                : 'DD/MM/YYYY';
            formatted = DateFormatUtils.formatDate(value, config.format || defaultFormat);
            defaultTooltip = DateFormatUtils.formatDate(value, 'dddd, DD MMMM YYYY HH:mm:ss');
            break;

        case 'relative':
            formatted = DateFormatUtils.getRelativeTime(value);
            defaultTooltip = DateFormatUtils.formatDate(value, 'dddd, DD MMMM YYYY HH:mm');
            break;

        case 'calendar':
            formatted = DateFormatUtils.getCalendarTime(value);
            defaultTooltip = DateFormatUtils.formatDate(value, 'dddd, DD MMMM YYYY HH:mm');
            break;

        case 'fromNow':
            formatted = DateFormatUtils.getDurationFromNow(value);
            defaultTooltip = DateFormatUtils.formatDate(value, 'dddd, DD MMMM YYYY HH:mm');
            break;

        default:
            // Use Intl format or custom format
            if (config.dateStyle || config.timeStyle) {
                formatted = DateFormatUtils.formatIntl(value, config);
            } else {
                formatted = DateFormatUtils.formatDate(value, config.format);
            }
            defaultTooltip = DateFormatUtils.formatDate(value, 'dddd, DD MMMM YYYY HH:mm:ss');
    }

    // Smart relative/absolute display
    if (config.relative && DateFormatUtils.shouldShowRelative(value, config.relativeThreshold)) {
        formatted = DateFormatUtils.getRelativeTime(value);
    }

    // Apply color scheme
    const color = DateFormatUtils.getDateColor(value, colorScheme, deadlineDate);

    // Add timezone if needed
    let timezoneDisplay = '';
    if (config.showTimeZone && config.timeZone) {
        timezoneDisplay = ` (${DateFormatUtils.getTimezoneDisplay(value, config.timeZone)})`;
    }

    const finalStyle: React.CSSProperties = {
        color,
        ...style
    };

    // Select appropriate icon
    let displayIcon = icon;
    if (showIcon && !icon) {
        displayIcon = mode === 'time' ? <ClockCircleOutlined/> : <CalendarOutlined/>;
    }

    const displayElement = (
        <span
            className={`date-display date-display-${mode} ${className}`}
            style={finalStyle}
            title={showTooltip ? undefined : defaultTooltip} // Fallback tooltip
        >
      {displayIcon && <span className="date-icon" style={{marginRight: 4}}>{displayIcon}</span>}
            {formatted}{timezoneDisplay}
    </span>
    );

    // Wrap with tooltip if needed
    const finalTooltipContent = tooltipContent || (showTooltip && tooltipFormat
        ? DateFormatUtils.formatDate(value, tooltipFormat)
        : showTooltip ? defaultTooltip : undefined);

    if (finalTooltipContent) {
        return (
            <Tooltip title={finalTooltipContent} placement="top">
                {displayElement}
            </Tooltip>
        );
    }

    return displayElement;
};