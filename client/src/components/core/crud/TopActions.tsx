import { Button, Space } from 'antd';
import type { ReactNode } from 'react';
import { observer } from 'mobx-react-lite';
import {checkPermissionUser} from "../../../utils/auth.utils.ts";
import {useStore} from "../../../store";

export interface TopActionConfig {
  title?: string;
  icon?: ReactNode;
  onClick?: () => void;
  permission?: string;
  /** Custom render — bypass mặc định Button. */
  content?: ReactNode;
  type?: 'primary' | 'default' | 'text' | 'link' | 'dashed';
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

interface TopActionsProps {
  topActions?: TopActionConfig[];
}

const TopActions = observer(function TopActions({ topActions }: TopActionsProps) {
  const { sessionStore } = useStore();

  if (!topActions?.length) return null;

  return (
    <Space>
      {topActions.map((action, idx) => {
        if (!checkPermissionUser(sessionStore.appSession, action.permission)) {
          return null;
        }

        if (action.content) {
          return <span key={`top-action-${idx}`}>{action.content}</span>;
        }

        return (
          <Button
            key={`top-action-${idx}`}
            type={action.type ?? 'default'}
            icon={action.icon}
            danger={action.danger}
            disabled={action.disabled}
            loading={action.loading}
            onClick={action.onClick}
            className={action.className}
          >
            {action.title}
          </Button>
        );
      })}
    </Space>
  );
});

export default TopActions;
