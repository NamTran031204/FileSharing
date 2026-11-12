// webapp/src/plugin-core/table/paged/settings/ColumnToggleDropdown.tsx
import React, {useMemo} from 'react';
import {Button, Checkbox, Divider, Dropdown, Tooltip} from 'antd';
import {AppstoreOutlined} from '@ant-design/icons';
import {type ToggleableColumn} from './settings.types';
import {l} from '@plugin-core/shared/language/lang.utils';

interface ColumnToggleDropdownProps {
    columns: ToggleableColumn[];
    onToggleColumn: (id: string, visible: boolean) => void;
    onToggleAll: (visible: boolean) => void;
}

const ColumnToggleTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
    <div
        ref={ref}
        {...props}
        style={{position: 'relative', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', ...(props.style || {})}}
    >
        <Tooltip title={l.transCommon('table.columns.tooltip')} placement="topRight">
            <Button
                aria-label={l.transCommon('table.columns.tooltip')}
                type="text"
                icon={
                    <AppstoreOutlined style={{fontSize: 20, color: 'var(--vtt-text-secondary)'}}/>
                }
                style={{width: 28, height: 28, padding: 0, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center'}}
            />
        </Tooltip>
    </div>
));

export const ColumnToggleDropdown: React.FC<ColumnToggleDropdownProps> = ({
    columns,
    onToggleColumn,
    onToggleAll,
}) => {
    const toggleable = useMemo(() => columns.filter((c) => !c.locked), [columns]);
    const allChecked = toggleable.length > 0 && toggleable.every((c) => c.visible);
    const someChecked = toggleable.some((c) => c.visible);
    const indeterminate = someChecked && !allChecked;
    const dropdownContent = (
        <div style={{
            padding: '6px 0',
            minWidth: 168,
            background: 'var(--color-card)',
            borderRadius: 8,
            boxShadow: '0 6px 16px color-mix(in srgb, var(--color-foreground) 12%, transparent), 0 3px 6px color-mix(in srgb, var(--color-foreground) 8%, transparent)',
        }}>
            <div style={{padding: '4px 12px 6px'}}>
                <Checkbox
                    checked={allChecked}
                    indeterminate={indeterminate}
                    onChange={(e) => onToggleAll(e.target.checked)}
                    style={{fontWeight: 500, fontSize: 12, color: 'var(--color-muted-foreground)'}}
                >
                    {l.transCommon('table.columns.all')}
                </Checkbox>
            </div>
            <Divider style={{margin: '2px 0 4px'}}/>
            {columns.map((col) => (
                <div key={col.id} style={{padding: '3px 12px'}}>
                    <Checkbox
                        checked={col.visible}
                        disabled={col.locked}
                        onChange={(e) => onToggleColumn(col.id, e.target.checked)}
                        style={{fontSize: 13, color: col.locked ? 'var(--color-muted-foreground)' : 'var(--color-foreground)'}}
                    >
                        {col.label}
                    </Checkbox>
                </div>
            ))}
        </div>
    );

    return (
        <Dropdown popupRender={() => dropdownContent} trigger={['click']}>
            <ColumnToggleTrigger/>
        </Dropdown>
    );
};
