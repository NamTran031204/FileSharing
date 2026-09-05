import type { ReactNode } from 'react';
import { IconArrowLeft, IconShare } from '../../imageReview/icons/ReviewIcons';

export interface ReviewParticipant {
  key: string;
  name: string;
  initials: string;
}

export interface ReviewTopBarProps {
  projectName?: string;
  fileName?: string;
  participants: ReviewParticipant[];
  onBack: () => void;
  onShare?: () => void;
  right?: ReactNode;
}

const MAX_VISIBLE_AVATARS = 3;

export function ReviewTopBar({
  projectName,
  fileName,
  participants,
  onBack,
  onShare,
  right,
}: ReviewTopBarProps) {
  const visible = participants.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = participants.length - visible.length;

  return (
    <div className="z-20 flex h-14 shrink-0 items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-card)] px-4">
      <button
        onClick={onBack}
        title="Back"
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[var(--color-foreground)] transition-all hover:bg-[var(--color-background)]"
      >
        <IconArrowLeft />
      </button>

      <div className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-[var(--color-muted-foreground)]">
        <span className="shrink-0">Projects</span>
        {projectName && (
          <>
            <span>/</span>
            <span className="truncate text-[var(--color-foreground)]">{projectName}</span>
          </>
        )}
        {fileName && (
          <>
            <span>/</span>
            <span className="truncate text-[var(--color-foreground)]">{fileName}</span>
          </>
        )}
      </div>

      <div className="flex-1" />

      {participants.length > 0 && (
        <div className="flex items-center">
          {visible.map(p => (
            <div
              key={p.key}
              title={p.name}
              className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent)] text-[9px] font-black text-[var(--color-foreground)] ring-2 ring-[var(--color-card)] first:ml-0"
            >
              {p.initials}
            </div>
          ))}
          {overflow > 0 && (
            <div className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-muted)] text-[9px] font-black text-[var(--color-foreground)] ring-2 ring-[var(--color-card)]">
              +{overflow}
            </div>
          )}
        </div>
      )}

      <button
        onClick={onShare}
        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-bold text-[var(--color-foreground)] transition-all hover:bg-[var(--color-background)]"
      >
        <IconShare />
        <span>Share</span>
      </button>

      {right && <div className="flex shrink-0 items-center gap-2 text-xs font-bold text-[var(--color-foreground)]">{right}</div>}
    </div>
  );
}
