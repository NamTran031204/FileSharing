import { FolderFilled, MoreOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import type { MouseEvent, ReactNode } from 'react';
import ActionDropdown, { type ActionDropdownItem } from '../core/common/ActionDropdown.tsx';

interface FolderCardProps<TRecord = unknown> {
  name: string;
  itemCount: number;
  /** icon khoa/globe canh ten, do FolderAssetPage truyen */
  visibilityBadge?: ReactNode;
  onClick?: () => void;
  actions?: ActionDropdownItem<TRecord>[];
  record?: TRecord;
  canAccess?: (permission?: string) => boolean;
}

const FolderCard = <TRecord,>({
  name,
  itemCount,
  visibilityBadge,
  onClick,
  actions,
  record,
  canAccess,
}: FolderCardProps<TRecord>) => {
  const itemLabel = itemCount === 1 ? 'item' : 'items';
  const cardActions: ActionDropdownItem<TRecord>[] =
    actions ??
    [
      { title: 'edit', titleCustom: 'Sửa' },
      { title: 'remove', titleCustom: 'Xoá', isDanger: true },
    ];
  const hasActions = cardActions.length > 0;

  const stopPropagation = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-full items-center gap-4 rounded-2xl border border-border/40 bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary transition group-hover:bg-primary group-hover:text-white">
        <FolderFilled className="text-lg" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground transition group-hover:text-primary">
          <span className="truncate">{name}</span>
          {visibilityBadge}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {itemCount} {itemLabel}
        </p>
      </div>

      {hasActions && (
        <div
          className="opacity-0 transition group-hover:opacity-100"
          onClick={stopPropagation}
        >
          <ActionDropdown<TRecord>
            actions={cardActions}
            record={record}
            canAccess={canAccess}
          />
        </div>
      )}
    </button>
  );
};

export default FolderCard;
