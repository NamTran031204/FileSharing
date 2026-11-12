import React, {useCallback} from 'react';
import {DatePicker} from 'antd';
import {Dayjs} from 'dayjs';
import {IconsaxCalendar} from '@plugin-core/shared/icon/IconsaxIcons';

export type QuickDateRangeValue = [Dayjs | null, Dayjs | null] | null;

interface QuickDateRangePickerProps {
    value?: QuickDateRangeValue;
    onChange: (range: [Dayjs, Dayjs]) => void;
    className?: string;
    placeholder?: [string, string];
    allowClear?: boolean;
}

export const QuickDateRangePicker: React.FC<QuickDateRangePickerProps> = ({
    value,
    onChange,
    className,
    placeholder = ['--/--/----', '--/--/----'],
    allowClear = false,
}) => {
    const updateDateRange = useCallback((dates: null | [Dayjs | null, Dayjs | null]) => {
        if (!dates?.[0] || !dates?.[1]) return;
        onChange([dates[0], dates[1]]);
    }, [onChange]);

    return (
        <DatePicker.RangePicker
            className={className}
            style={{width: '100%', paddingInline: 10}}
            allowClear={allowClear}
            format={{format: 'DD/MM/YYYY', type: 'mask'}}
            value={value}
            placeholder={placeholder}
            suffixIcon={<IconsaxCalendar style={{fontSize: 20, color: 'var(--vtt-text-secondary)'}}/>}
            onChange={(dates) => updateDateRange(dates as null | [Dayjs | null, Dayjs | null])}
        />
    );
};

export default QuickDateRangePicker;
