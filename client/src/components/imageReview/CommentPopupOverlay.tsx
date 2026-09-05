import { IconX } from './icons/ReviewIcons';

interface CommentPopupOverlayProps {
  position: { x: number; y: number };
  commentText: string;
  isSaving: boolean;
  annotationError: string | null;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onTextChange: (text: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function CommentPopupOverlay({
  position,
  commentText,
  isSaving,
  annotationError,
  textareaRef,
  onTextChange,
  onSubmit,
  onClose,
}: CommentPopupOverlayProps) {
  return (
    <div
      className="fixed z-50 w-72 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-2xl"
      style={{
        top: Math.min(window.innerHeight - 260, Math.max(80, position.y - 120)),
        left: Math.min(window.innerWidth - 320, Math.max(60, position.x + 16)),
      }}
    >
      <div className="mb-3 flex items-center justify-between border-b border-[var(--color-border)]/30 pb-2">
        <span className="text-xs font-black uppercase tracking-wider text-[var(--color-foreground)]">New Comment</span>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          <IconX />
        </button>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <textarea
          ref={textareaRef}
          value={commentText}
          onChange={e => onTextChange(e.target.value)}
          placeholder="Type a comment… use @ to mention"
          rows={3}
          className="w-full resize-none rounded-lg border border-[var(--color-border)]/50 bg-[var(--color-background)] p-2.5 text-xs text-[var(--color-foreground)] outline-none transition-all placeholder:text-[var(--color-muted-foreground)]/50 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20"
        />
        {annotationError && (
          <p className="text-[10px] text-[var(--color-destructive)]">{annotationError}</p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[var(--color-border)]/40 bg-[var(--color-background)] py-1.5 text-xs font-bold text-[var(--color-foreground)] transition-all hover:bg-[var(--color-border)]/20"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 rounded-lg bg-[var(--color-primary)] py-1.5 text-xs font-bold text-white transition-all hover:bg-[var(--color-secondary)] disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
