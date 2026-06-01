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
      className="fixed z-50 w-72 rounded-xl border border-[hsl(244,30%,80%)] bg-white p-4 shadow-2xl"
      style={{
        top: Math.min(window.innerHeight - 260, Math.max(80, position.y - 120)),
        left: Math.min(window.innerWidth - 320, Math.max(60, position.x + 16)),
      }}
    >
      <div className="mb-3 flex items-center justify-between border-b border-[hsl(244,30%,80%)]/30 pb-2">
        <span className="text-xs font-black uppercase tracking-wider text-[hsl(237,45%,30%)]">New Comment</span>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-[hsl(244,10%,40%)] hover:text-[hsl(237,45%,30%)]"
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
          className="w-full resize-none rounded-lg border border-[hsl(244,30%,80%)]/50 bg-[hsl(240,10%,96%)] p-2.5 text-xs text-[hsl(237,45%,30%)] outline-none transition-all placeholder:text-[hsl(244,10%,40%)]/50 focus:border-[hsl(240,30%,46%)] focus:ring-1 focus:ring-[hsl(240,30%,46%)]/20"
        />
        {annotationError && (
          <p className="text-[10px] text-red-500">{annotationError}</p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[hsl(244,30%,80%)]/40 bg-[hsl(240,10%,96%)] py-1.5 text-xs font-bold text-[hsl(237,45%,30%)] transition-all hover:bg-[hsl(244,30%,80%)]/20"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 rounded-lg bg-[hsl(240,30%,46%)] py-1.5 text-xs font-bold text-white transition-all hover:bg-[hsl(244,30%,61%)] disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
