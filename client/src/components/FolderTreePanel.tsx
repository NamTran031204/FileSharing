import { CaretDownOutlined, CaretRightOutlined, FolderFilled, MenuFoldOutlined } from '@ant-design/icons';
import { useState } from 'react';

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
}

const TreeItem = ({ item, level, activeId, onSelect }: TreeItemProps) => {
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
        {hasChildren ? (
          <span
            className="w-[18px] h-[18px] flex items-center justify-center flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? (
              <CaretDownOutlined className="text-[10px]" />
            ) : (
              <CaretRightOutlined className="text-[10px]" />
            )}
          </span>
        ) : (
          <span className="w-[18px] h-[18px] flex items-center justify-center flex-shrink-0 text-muted-foreground">
            <FolderFilled className="text-[12px]" />
          </span>
        )}
        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{item.name}</span>
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
  onCollapse: () => void;
}

const FolderTreePanel = ({ treeData, activeId, onSelect, onCollapse }: FolderTreePanelProps) => {
  return (
    <div className="w-[280px] flex-shrink-0 bg-card border-r border-border overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-3 px-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Folder Tree
        </span>
        <button
          className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-background hover:text-primary transition-all"
          onClick={onCollapse}
          title="Collapse tree"
        >
          <MenuFoldOutlined className="text-base" />
        </button>
      </div>

      <div>
        {treeData.map((root) => (
          <TreeItem
            key={root.id}
            item={root}
            level={0}
            activeId={activeId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default FolderTreePanel;
