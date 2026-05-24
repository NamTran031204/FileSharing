import { MessageOutlined, MinusOutlined, PlusOutlined, DragOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import type { MouseEvent } from 'react';

interface CapsuleControlsProps {
  zoomPercent: number;
  isPanActive: boolean;
  isCommentActive: boolean;
  onTogglePan: () => void;
  onToggleComment: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

interface CapsuleButtonProps {
  active?: boolean;
  title: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}

const CapsuleButton = ({ active, title, onClick, children }: CapsuleButtonProps) => (
  <Tooltip title={title}>
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-full text-base transition-colors ${
        active
          ? 'bg-primary text-white'
          : 'text-foreground hover:bg-background'
      }`}
    >
      {children}
    </button>
  </Tooltip>
);

const CapsuleControls = ({
  zoomPercent,
  isPanActive,
  isCommentActive,
  onTogglePan,
  onToggleComment,
  onZoomIn,
  onZoomOut,
}: CapsuleControlsProps) => {
  return (
    <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-3xl bg-card p-2 shadow-[0_4px_16px_rgba(42,47,111,0.12),0_0_0_1px_rgba(42,47,111,0.08)]">
      <CapsuleButton title="Pan (drag image)" active={isPanActive} onClick={onTogglePan}>
        <DragOutlined />
      </CapsuleButton>

      <div className="mx-1 my-2 h-6 w-px bg-border/40" />

      <CapsuleButton title="Zoom out" onClick={onZoomOut}>
        <MinusOutlined />
      </CapsuleButton>
      <div className="flex min-w-[60px] items-center justify-center px-3 text-[13px] font-semibold text-muted-foreground">
        {zoomPercent}%
      </div>
      <CapsuleButton title="Zoom in" onClick={onZoomIn}>
        <PlusOutlined />
      </CapsuleButton>

      <div className="mx-1 my-2 h-6 w-px bg-border/40" />

      <CapsuleButton title="Comment" active={isCommentActive} onClick={onToggleComment}>
        <MessageOutlined />
      </CapsuleButton>
    </div>
  );
};

export default CapsuleControls;
