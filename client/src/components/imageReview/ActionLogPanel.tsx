import type { ActionLogItem } from './types';

interface ActionLogPanelProps {
  items: ActionLogItem[];
}

const ActionLogPanel = ({ items }: ActionLogPanelProps) => {
  if (items.length === 0) {
    return <div className="text-center text-xs text-muted-foreground">No activity logged.</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((log) => (
        <div key={log.id} className="flex gap-3 rounded-lg bg-background p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-card text-sm">
            {log.icon}
          </div>
          <div className="flex-1">
            <div className="text-[13px] text-foreground">
              {log.action}
              {log.details && <span className="text-muted-foreground"> - {log.details}</span>}
            </div>
            <div className="text-[11px] text-muted-foreground">{log.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActionLogPanel;
