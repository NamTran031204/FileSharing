import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  PrinterOutlined,
  SwapOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { Dropdown, type DropdownProps, type MenuProps } from 'antd';
import { useMemo } from 'react';

export interface ActionDropdownItem<TRecord> {
  title: 'view' | 'edit' | 'remove' | string;
  titleCustom?: string;
  icon?: React.ReactNode;
  onClick?: (record?: TRecord) => void;
  permission?: string;
  hiddenIf?: (record: TRecord) => boolean;
  content?: (record?: TRecord) => React.ReactNode;
  contentLazy?: React.ComponentType<ActionDropdownLazyProps<TRecord>>;
  onSuccess?: (data: unknown) => void;
  isDanger?: boolean;
  disableIf?: (record: TRecord) => boolean;
}

export interface ActionDropdownLazyProps<TRecord> {
  title?: string;
  record?: TRecord;
  onSuccess?: (data: unknown) => void;
}

interface ActionDropdownProps<TRecord> {
  actions: ActionDropdownItem<TRecord>[];
  record?: TRecord;
  trigger: React.ReactNode;
  placement?: DropdownProps['placement'];
  disabled?: boolean;
  menuClassName?: string;
  onOpenChange?: (open: boolean) => void;
  canAccess?: (permission?: string) => boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  view: <EyeOutlined className="text-base" />,
  edit: <EditOutlined className="text-base" />,
  viewAndEdit: <EditOutlined className="text-base" />,
  copy: <CopyOutlined className="text-base text-primary" />,
  return: <UndoOutlined className="text-base text-primary" />,
  plus: <PlusOutlined className="text-base text-primary" />,
  print: <PrinterOutlined className="text-base" />,
  remove: <DeleteOutlined className="text-base" />,
  change: <SwapOutlined className="text-base" />,
};

const ActionDropdown = <TRecord,>({
  actions,
  record,
  trigger,
  placement = 'bottomRight',
  disabled,
  menuClassName,
  onOpenChange,
  canAccess,
}: ActionDropdownProps<TRecord>) => {
  const accessCheck = canAccess ?? (() => true);
  const safeRecord = (record ?? {}) as TRecord;

  const menuItems = useMemo<MenuProps['items']>(() => {
    return actions
      .filter((action) => {
        if (action.hiddenIf && action.hiddenIf(safeRecord)) {
          return false;
        }

        return accessCheck(action.permission);
      })
      .map((action, index) => {
        if (action.contentLazy) {
          const ContentLazy = action.contentLazy;

          return {
            key: action.title ? `${action.title}-${index}` : `${index}`,
            label: (
              <ContentLazy
                title={action.titleCustom ?? action.title}
                record={record}
                onSuccess={action.onSuccess}
              />
            ),
          };
        }

        if (action.content) {
          return {
            key: action.title ? `${action.title}-${index}` : `${index}`,
            label: action.content(record),
            onClick: () => action.onClick?.(record),
            disabled: action.disableIf?.(safeRecord),
          };
        }

        const icon = action.icon ?? iconMap[action.title];
        const labelText = action.titleCustom ?? action.title;

        return {
          key: action.title ? `${action.title}-${index}` : `${index}`,
          label: (
            <div className="flex items-center gap-2">
              {icon}
              <span>{labelText}</span>
            </div>
          ),
          onClick: () => action.onClick?.(record),
          disabled: action.disableIf?.(safeRecord),
          danger: action.isDanger,
          className: action.isDanger ? 'text-destructive' : undefined,
        };
      });
  }, [actions, accessCheck, record, safeRecord]);

  const combinedMenuClassName = [
    'min-w-[180px] rounded-xl border border-border bg-card p-1 shadow-lg',
    '[&_.ant-dropdown-menu-item]:rounded-lg',
    '[&_.ant-dropdown-menu-item]:text-sm',
    '[&_.ant-dropdown-menu-item]:font-medium',
    '[&_.ant-dropdown-menu-item]:text-foreground',
    '[&_.ant-dropdown-menu-item:hover]:bg-muted/60',
    '[&_.ant-dropdown-menu-item-disabled]:text-muted-foreground',
    '[&_.ant-dropdown-menu-item-danger]:text-destructive',
    '[&_.ant-dropdown-menu-item-danger:hover]:bg-destructive/10',
    menuClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Dropdown
      menu={{ items: menuItems, className: combinedMenuClassName }}
      placement={placement}
      trigger={['click']}
      disabled={disabled}
      onOpenChange={onOpenChange}
    >
      <span className="inline-flex">{trigger}</span>
    </Dropdown>
  );
};

export default ActionDropdown;
