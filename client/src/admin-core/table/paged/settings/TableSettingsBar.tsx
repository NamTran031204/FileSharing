// webapp/src/plugin-core/table/paged/settings/TableSettingsBar.tsx
import React from 'react';
import {type TableSettingsControls} from './settings.types';
import {DensityDropdown} from './DensityDropdown';
import {ColumnToggleDropdown} from './ColumnToggleDropdown';

interface TableSettingsBarProps {
    controls: TableSettingsControls;
}

export const TableSettingsBar: React.FC<TableSettingsBarProps> = ({controls}) => {
    return (
        <div className="ord-table-settings-bar" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0,
            background: 'var(--vtt-surface, var(--color-card))',
            border: '1px solid var(--vtt-border, var(--color-border))',
            borderRadius: 8,
            padding: 2,
            overflow: 'visible',
        }}>
            <DensityDropdown value={controls.density} onChange={controls.onDensityChange}/>
            <ColumnToggleDropdown
                columns={controls.columns}
                onToggleColumn={controls.onToggleColumn}
                onToggleAll={controls.onToggleAll}
            />
        </div>
    );
};