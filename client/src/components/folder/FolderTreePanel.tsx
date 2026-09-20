import {
  CaretDownOutlined,
  CaretRightOutlined,
  FolderFilled,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  SearchOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { Input, Segmented, Tooltip } from 'antd';
import { type ReactNode, useState } from 'react';
import ActionDropdown, { type ActionDropdownItem } from '../core/common/ActionDropdown.tsx';

export interface FolderTreeNode {
  id: string | number;
  name: string;
  children?: FolderTreeNode[];
}

interface TreeItemProps {
  item: FolderTreeNode;
  level: number;
  activeId: string | number | null;
  onSelect: (id: string | number) => void;
  /** Chi truyen cho node cap 0 (root project) — nut collapse ca panel dat canh ten project */
  trailingAction?: ReactNode;
}

const TreeItem = ({ item, level, activeId, onSelect, trailingAction }: TreeItemProps) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = activeId === item.id;

  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-md cursor-pointer transition-all duration-150 text-sm mb-0.5 ${
          isActive
            ? 'bg-accent/15 text-primary font-semibold'
            : 'text-foreground hover:bg-background'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px`, paddingTop: 8, paddingBottom: 8, paddingRight: 8 }}
        onClick={() => onSelect(item.id)}
      >
        <span
          className="w-[14px] h-[18px] flex items-center justify-center flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
          onClick={
            hasChildren
              ? (e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }
              : undefined
          }
        >
          {hasChildren &&
            (expanded ? (
              <CaretDownOutlined className="text-[10px]" />
            ) : (
              <CaretRightOutlined className="text-[10px]" />
            ))}
        </span>
        <span className="w-[18px] h-[18px] flex items-center justify-center flex-shrink-0 text-muted-foreground">
          <FolderFilled className="text-[12px]" />
        </span>
        <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{item.name}</span>
        {trailingAction}
      </div>

      {hasChildren && expanded && (
        <div>
          {item.children!.map((child) => (
            <TreeItem
              key={child.id}
              item={child}
              level={level + 1}
              activeId={activeId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface FolderTreePanelProps {
  treeData: FolderTreeNode[];
  activeId: string | number | null;
  onSelect: (id: string | number) => void;
  /** true = thu gon thanh rail doc 48px chi con icon, false = panel day du 280px */
  collapsed: boolean;
  onToggleCollapse: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
  /** Actions cho nut New (Upload File / Upload Folder) — dung chung cho ca 2 trigger (day du + rail thu gon) */
  newActions: ActionDropdownItem<unknown>[];
}

const FolderTreePanel = ({
  treeData,
  activeId,
  onSelect,
  collapsed,
  onToggleCollapse,
  searchValue,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  advancedOpen,
  onToggleAdvanced,
  newActions,
}: FolderTreePanelProps) => {
  if (collapsed) {
    return (
      <div className="flex w-12 shrink-0 flex-col items-center gap-4 border-r border-border bg-card py-4">
        <Tooltip title="Expand folder tree" placement="right">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand folder tree"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-background hover:text-primary"
          >
            <MenuUnfoldOutlined className="text-base" />
          </button>
        </Tooltip>
        <Tooltip title="Search files and folders" placement="right">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Search files and folders"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-background hover:text-primary"
          >
            <SearchOutlined className="text-base" />
          </button>
        </Tooltip>
        <ActionDropdown
          actions={newActions}
          trigger={
            <Tooltip title="New" placement="right">
              <button
                type="button"
                aria-label="New"
                className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition-all hover:bg-primary-dark"
              >
                <PlusOutlined className="text-base" />
              </button>
            </Tooltip>
          }
        />
        <Tooltip title="Folder tree" placement="right">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand folder tree"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-background hover:text-primary"
          >
            <FolderFilled className="text-base" />
          </button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex w-[280px] flex-shrink-0 flex-col bg-card border-r border-border overflow-y-auto p-4">
      <ActionDropdown
        actions={newActions}
        trigger={
          <button
            type="button"
            className="mb-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-linear-to-br from-primary-dark to-primary font-semibold text-primary-foreground shadow-md shadow-primary-dark/20"
          >
            <PlusOutlined />
            New
          </button>
        }
      />

      <Input
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        prefix={<SearchOutlined className="text-muted-foreground" />}
        placeholder="Search files and folders..."
        allowClear
        className="mb-3 h-9 rounded-lg"
      />

      <div className="mb-3 flex items-center justify-between gap-2">
        <Segmented
          block
          value={typeFilter}
          onChange={(value) => onTypeFilterChange(String(value))}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Images', value: 'image' },
            { label: 'Videos', value: 'video' },
            { label: 'Docs', value: 'doc' },
          ]}
          size="small"
          className="min-w-0 flex-1 rounded-lg [&_.ant-segmented-item]:px-1 [&_.ant-segmented-item-label]:text-[11px]"
        />
        <Tooltip title="Advanced filter">
          <button
            type="button"
            onClick={onToggleAdvanced}
            aria-label="Advanced filter"
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all ${
              advancedOpen
                ? 'border-primary text-primary'
                : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
            }`}
          >
            <SlidersOutlined />
          </button>
        </Tooltip>
      </div>

      <div>
        {treeData.map((root) => (
          <TreeItem
            key={root.id}
            item={root}
            level={0}
            activeId={activeId}
            onSelect={onSelect}
            trailingAction={
              <button
                type="button"
                className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-background hover:text-primary transition-all flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse();
                }}
                title="Collapse tree"
                aria-label="Collapse tree"
              >
                <MenuFoldOutlined className="text-base" />
              </button>
            }
          />
        ))}
      </div>
    </div>
  );
};

export default FolderTreePanel;
