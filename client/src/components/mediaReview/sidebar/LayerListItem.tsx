import type { AnnotationCore } from '../../../store/review/ReviewCoreStore';
import { IconLayerArrow, IconLayerCircle, IconLayerRect } from '../../imageReview/icons/ReviewIcons';
import { formatRelativeTime } from '../../../utils/date.util';

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface LayerListItemProps {
  ann: AnnotationCore;
  index: number;
  variant: 'image' | 'video';
  isHighlighted: boolean;
  onClick: () => void;
}

export function LayerListItem({ ann, index, variant, isHighlighted, onClick }: LayerListItemProps) {
  const isOpen = ann.status === 'OPEN';
  const shape = ann.region?.[0]?.shape as string | undefined;

  const Icon =
    variant === 'video'
      ? IconLayerCircle
      : shape === 'CIRCLE'
      ? IconLayerCircle
      : shape === 'RECT'
      ? IconLayerRect
      : IconLayerArrow;

  const timeLabel =
    variant === 'video'
      ? formatMs(ann.timeCode?.startMs != null ? Number(ann.timeCode.startMs) : 0)
      : formatRelativeTime(ann.createdAt);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-all ${
        isHighlighted ? 'bg-[var(--color-accent)]/25' : 'hover:bg-[var(--color-background)]'
      }`}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center text-[var(--color-foreground)]">
        <Icon />
      </span>
      <span className="flex-1 truncate text-xs font-bold text-[var(--color-foreground)]">
        Comment #{index + 1}
      </span>
      <span
        className={`shrink-0 text-[10px] ${variant === 'video' ? 'font-mono' : ''} text-[var(--color-muted-foreground)]`}
      >
        {timeLabel}
      </span>
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-black ${
          isOpen
            ? 'bg-[var(--color-accent)] text-[var(--color-foreground)]'
            : 'bg-[var(--color-border)] text-[var(--color-muted-foreground)]'
        }`}
      >
        {isOpen ? 'OPEN' : 'RESOLVED'}
      </span>
    </button>
  );
}
