import { IconTrash } from '../../imageReview/icons/ReviewIcons';
import type { AnnotationWithShapes } from '../../../store/review/ImagePlayerStore';
import { formatRelativeTime } from '../../../utils/date.util';

interface CommentThreadProps {
  ann: AnnotationWithShapes;
  isHighlighted: boolean;
  isExpanded: boolean;
  replyingToId: string | null;
  replyText: string;
  isSaving: boolean;
  onHighlightToggle: (id: string | null) => void;
  onReplyOpen: (id: string) => void;
  onReplyTextChange: (text: string) => void;
  onSubmitReply: (e: React.FormEvent, threadRootId: string) => void;
  onResolve: (id: string) => void;
  onReopen: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleExpand: (id: string) => void;
}

export function CommentThread({
  ann,
  isHighlighted,
  isExpanded,
  replyingToId,
  replyText,
  isSaving,
  onHighlightToggle,
  onReplyOpen,
  onReplyTextChange,
  onSubmitReply,
  onResolve,
  onReopen,
  onDelete,
  onToggleExpand,
}: CommentThreadProps) {
  const isOpen = ann.status === 'OPEN';
  const authorInitials = (ann.authorName ?? ann.authorId ?? 'U').slice(0, 2).toUpperCase();
  const annId = ann.annotationId ?? '';

  return (
    <div
      key={ann.annotationId}
      onClick={() => onHighlightToggle(isHighlighted ? null : annId)}
      className={`cursor-pointer rounded-xl border bg-[var(--color-background)] p-3.5 transition-all hover:border-[var(--color-border)]/30 ${
        isHighlighted
          ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20'
          : 'border-[var(--color-border)]/20'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent)]/30 text-[9px] font-bold text-[var(--color-foreground)]">
            {authorInitials}
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--color-foreground)]">
              {ann.authorName ?? ann.authorId ?? 'Unknown'}
            </h4>
            <span className="text-[9px] text-[var(--color-muted-foreground)]/60">
              {formatRelativeTime(ann.createdAt)}
            </span>
          </div>
        </div>
        {isOpen ? (
          <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[8px] font-black text-emerald-800">OPEN</span>
        ) : (
          <span className="rounded border border-[var(--color-border)] bg-[var(--color-background)] px-1.5 py-0.5 text-[8px] font-black text-[var(--color-muted-foreground)]">RESOLVED</span>
        )}
      </div>

      <p
        className="mt-2.5 text-xs font-semibold leading-relaxed text-[var(--color-foreground)]/80"
        onClick={e => e.stopPropagation()}
      >
        {ann.commentBody?.body}
      </p>

      {isExpanded && ann.replies.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-[var(--color-border)]/20 pt-2">
          {ann.replies.map(reply => (
            <div key={reply.annotationId} className="flex gap-2 pl-[38px]">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-[8px] font-bold text-[var(--color-foreground)]">
                {(reply.authorName ?? reply.authorId ?? 'U').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-[9px] font-bold text-[var(--color-foreground)]">
                  {reply.authorName ?? reply.authorId ?? 'Unknown'}
                </span>
                <p className="text-[10px] text-[var(--color-foreground)]/75">{reply.commentBody?.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {replyingToId === ann.annotationId && (
        <form
          onSubmit={e => onSubmitReply(e, annId)}
          onClick={e => e.stopPropagation()}
          className="mt-3 flex flex-col gap-1.5 border-t border-[var(--color-border)]/20 pt-2 pl-[38px]"
        >
          <textarea
            value={replyText}
            onChange={e => onReplyTextChange(e.target.value)}
            placeholder="Write a reply…"
            rows={2}
            autoFocus
            className="w-full resize-none rounded-lg border border-[var(--color-border)]/50 bg-[var(--color-card)] p-2 text-xs text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]"
          />
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => onReplyOpen('')}
              className="flex-1 rounded-lg border border-[var(--color-border)]/40 py-1 text-[10px] font-bold text-[var(--color-foreground)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-lg bg-[var(--color-primary)] py-1 text-[10px] font-bold text-white disabled:opacity-60"
            >
              Send
            </button>
          </div>
        </form>
      )}

      <div
        className="mt-3 flex items-center justify-between border-t border-[var(--color-border)]/20 pt-2"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          {isOpen ? (
            <button
              onClick={() => onResolve(annId)}
              className="cursor-pointer text-[10px] font-bold text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]"
            >
              Resolve
            </button>
          ) : (
            <button
              onClick={() => onReopen(annId)}
              className="cursor-pointer text-[10px] font-bold text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]"
            >
              Reopen
            </button>
          )}
          <button
            onClick={() => onReplyOpen(annId)}
            className="cursor-pointer text-[10px] font-bold text-[var(--color-primary)] hover:underline"
          >
            Reply
          </button>
          {(ann.replyCount ?? 0) > 0 && (
            <button
              onClick={() => onToggleExpand(annId)}
              className="cursor-pointer text-[10px] font-bold text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]"
            >
              {isExpanded ? 'Hide' : `${ann.replyCount ?? 0} repl${(ann.replyCount ?? 0) === 1 ? 'y' : 'ies'}`}
            </button>
          )}
        </div>
        <button
          onClick={() => onDelete(annId)}
          className="text-[var(--color-border)] transition-colors hover:text-[var(--color-destructive)]"
          title="Delete"
        >
          <IconTrash />
        </button>
      </div>
    </div>
  );
}
