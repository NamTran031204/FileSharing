import { DownOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

const CollapsibleSection = ({ title, expanded, onToggle, children }: CollapsibleSectionProps) => {
  return (
    <div className="border-b border-border/30">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-background"
      >
        <span className="text-[13px] font-bold uppercase tracking-wider text-foreground">{title}</span>
        <DownOutlined
          className={`text-xs text-muted-foreground transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-[max-height] duration-300 ${
          expanded ? 'max-h-[600px]' : 'max-h-0'
        }`}
      >
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
