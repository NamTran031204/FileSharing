import { useEffect, useRef, useState } from 'react';
import { MoreOutlined } from '@ant-design/icons';

export interface ActionMenuItem {
  key: string;
  label: string;
  action?: () => void;
  callback?: () => void;
  style?: string;
}

interface ActionMenuProps {
  actions: ActionMenuItem[];
  style?: string;
}

const ActionMenu = ({ actions, style }: ActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (item: ActionMenuItem) => {
    setIsOpen(false);
    item.action?.();
    item.callback?.();
  };

  return (
    <div ref={menuRef} className="relative inline-flex">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Open actions"
        className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <MoreOutlined className="text-base" />
      </button>

      {isOpen && (
        <div
          className={`
            absolute right-0 mt-2 min-w-40 z-50
            bg-card border border-border rounded-lg shadow-lg
            py-1 overflow-hidden
            ${style ?? ''}
          `}
        >
          {actions.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleSelect(item);
              }}
              className={`
                w-full px-3 py-2 text-left text-sm font-medium
                text-foreground hover:bg-muted transition-colors
                ${item.style ?? ''}
              `}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionMenu;
