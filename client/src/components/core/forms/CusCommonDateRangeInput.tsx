import {Button, DatePicker, Dropdown, Space} from 'antd';
import {ArrowRightOutlined, FilterOutlined} from '@ant-design/icons';
import dayjs, {type Dayjs} from 'dayjs';
import {useCallback, useEffect, useMemo, useState} from 'react';
import FloatLabel from './FloatLabel';
import {
    type DateRangeDto,
    type DateRangePreset,
    disableAfter,
    disableAfterAndAfterNow,
    disableAfterOrSame,
    disableBefore,
    disableBeforeAndAfterNow,
    disableBeforeOrSame,
    getDateRange,
} from '../../../utils/date.util.ts';

type LabelMode = 'icon' | 'fromToLabel' | 'normal';

interface OrdDateRangeInputProps {
    id?: string;
    value?: DateRangeDto;
    onChange?: (value: DateRangeDto) => void;
    disabled?: boolean;
    labelMode?: LabelMode;
    allowEq?: boolean;
    notAllowFuture?: boolean;
    labelFromDate?: string;
    labelToDate?: string;
    isNotShowOptions?: boolean;
    valuesFilterHidden?: DateRangePreset[];
}

const DATE_RANGE_OPTS: { key: DateRangePreset; label: string }[] = [
    {key: 'hom_nay', label: 'Hôm nay'},
    {key: 'hom_qua', label: 'Hôm qua'},
    {key: '7_ngay_truoc', label: '7 ngày trước'},
    {key: 'thang_nay', label: 'Tháng này'},
    {key: 'thang_truoc', label: 'Tháng trước'},
];

const CusCommonDateRangeInput = (props: OrdDateRangeInputProps) => {
    const {
        id,
        value,
        onChange,
        disabled,
        labelMode = 'normal',
        allowEq,
        notAllowFuture,
        labelFromDate = 'Từ ngày',
        labelToDate = 'Đến ngày',
        isNotShowOptions,
        valuesFilterHidden,
    } = props;

    const [startDate, setStartDate] = useState<Dayjs | null | undefined>(value?.startDate);
    const [endDate, setEndDate] = useState<Dayjs | null | undefined>(value?.endDate);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        setStartDate(value?.startDate ?? null);
        setEndDate(value?.endDate ?? null);
    }, [value?.startDate, value?.endDate]);

    const triggerChange = (next: Partial<DateRangeDto>) => {
        const merged: DateRangeDto = {startDate, endDate, ...value, ...next};
        onChange?.(merged);
    };

    const disabledStartDate = (curr: Dayjs): boolean => {
        if (notAllowFuture) return disableAfterAndAfterNow(curr, endDate);
        if (allowEq) return disableAfter(curr, endDate);
        return disableAfterOrSame(curr, endDate);
    };

    const disabledEndDate = (curr: Dayjs): boolean => {
        if (notAllowFuture) return disableBeforeAndAfterNow(curr, startDate);
        if (allowEq) return disableBefore(curr, startDate);
        return disableBeforeOrSame(curr, startDate);
    };

    const applyPreset = useCallback(
        (key: DateRangePreset) => {
            const {startDate: s, endDate: e} = getDateRange(key);
            setStartDate(s);
            setEndDate(e);
            const merged: DateRangeDto = {startDate: s, endDate: e};
            onChange?.(merged);
            setDropdownOpen(false);
        },
        [onChange],
    );

    const fromDate = (
        <DatePicker
            value={startDate}
            onChange={(d) => {
                setStartDate(d);
                triggerChange({startDate: d});
            }}
            disabledDate={disabledStartDate}
            disabled={disabled}
            placeholder={labelFromDate}
            className="w-full"
            format="DD/MM/YYYY"
        />
    );

    const toDate = (
        <DatePicker
            value={endDate}
            onChange={(d) => {
                setEndDate(d);
                triggerChange({endDate: d});
            }}
            disabledDate={disabledEndDate}
            disabled={disabled}
            placeholder={labelToDate}
            className="w-full"
            format="DD/MM/YYYY"
        />
    );

    const presetDropdown = useMemo(() => {
        const visibleOpts = DATE_RANGE_OPTS.filter((o) => !valuesFilterHidden?.includes(o.key));
        return (
            <Dropdown
                open={dropdownOpen}
                onOpenChange={setDropdownOpen}
                trigger={['click']}
                placement="bottomRight"
                popupRender={() => (
                    <div className="rounded-lg border border-border bg-card p-2 shadow-lg">
                        {visibleOpts.map((opt) => (
                            <button
                                key={opt.key}
                                type="button"
                                onClick={() => applyPreset(opt.key)}
                                className="block w-full rounded-md px-4 py-2 text-left text-sm text-foreground hover:bg-muted/40"
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                )}
            >
                <Button icon={<FilterOutlined/>} disabled={disabled}/>
            </Dropdown>
        );
    }, [dropdownOpen, valuesFilterHidden, disabled, applyPreset]);

    if (labelMode === 'icon') {
        return (
            <Space.Compact className="w-full" id={id}>
                {fromDate}
                <ArrowRightOutlined className="mx-1 self-center"/>
                {toDate}
                {!isNotShowOptions && presetDropdown}
            </Space.Compact>
        );
    }

    if (labelMode === 'fromToLabel') {
        return (
            <div className="flex w-full gap-2" id={id}>
                <FloatLabel label={labelFromDate} className="flex-1">
                    {fromDate}
                </FloatLabel>
                <FloatLabel label={labelToDate} className="flex-1">
                    <Space.Compact className="w-full">
                        {toDate}
                        {!isNotShowOptions && presetDropdown}
                    </Space.Compact>
                </FloatLabel>
            </div>
        );
    }

    // normal mode
    return (
        <div className="flex w-full gap-2" id={id}>
            <div className="flex-1">
                <label className="mb-1 inline-block text-sm font-medium text-foreground">{labelFromDate}</label>
                {fromDate}
            </div>
            <div className="flex-1">
                <label className="mb-1 inline-block text-sm font-medium text-foreground">{labelToDate}</label>
                <Space.Compact className="w-full">
                    {toDate}
                    {!isNotShowOptions && presetDropdown}
                </Space.Compact>
            </div>
        </div>
    );
};

export default CusCommonDateRangeInput;
// Ensure dayjs side effect (locale, etc.) — placeholder import to avoid unused import elision
void dayjs;
