// webapp/src/plugin-core/table/paged/settings/DensityDropdown.tsx
import React from 'react';
import {Button, Dropdown, Tooltip} from 'antd';
import {ColumnHeightOutlined} from '@ant-design/icons';
import {type DensityLevel} from './settings.types';
import {l} from '@plugin-core/shared/language/lang.utils';

interface DensityDropdownProps {
    value: DensityLevel;
    onChange: (d: DensityLevel) => void;
}

// eslint-disable-next-line react-refresh/only-export-components -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
export const ROW_HEIGHT_ITEMS: {key: DensityLevel; labelKey: string}[] = [
    {key: 'small', labelKey: 'table.density.default'},
    {key: 'middle', labelKey: 'table.density.medium'},   // Trung bình
    {key: 'large', labelKey: 'table.density.large'},     // Cao
];

const DensityTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
    <div ref={ref} {...props} style={{display: 'inline-flex', ...(props.style || {})}}>
        <Tooltip title={l.transCommon('table.density.tooltip')} placement="topRight">
            <Button
                aria-label={l.transCommon('table.density.tooltip')}
                type="text"
                icon={<ColumnHeightOutlined style={{fontSize: 20, color: 'var(--vtt-text-secondary)'}}/>}
                style={{width: 28, height: 28, padding: 0, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center'}}
            />
        </Tooltip>
    </div>
));

export const DensityDropdown: React.FC<DensityDropdownProps> = ({value, onChange}) => {
    const menuItems = ROW_HEIGHT_ITEMS.map(({key, labelKey}) => ({
        key,
        label: l.transCommon(labelKey),
    }));

    return (
        <Dropdown
            menu={{
                items: menuItems,
                selectable: true,
                selectedKeys: [value],
                onClick: ({key}) => onChange(key as DensityLevel),
            }}
            trigger={['click']}
        >
            <DensityTrigger/>
        </Dropdown>
    );
};
