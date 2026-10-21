import UserAvatar from '../../core/common/UserAvatar.tsx';
import { IconTrash } from '../../imageReview/icons/ReviewIcons';
import type { AnnotationWithShapes } from '../../../store/review/ImagePlayerStore';
import { formatRelativeTime } from '../../../utils/date.util';
import i18n from '../../../i18n';

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
          <UserAvatar size={24} name={ann.authorName ?? ann.authorId} />
          <div>
            <h4 className="text-xs font-bold text-[var(--color-foreground)]">
              {ann.authorName ?? ann.authorId ?? i18n.t('review:commentThread.unknown')}
            </h4>
            <span className="text-[9px] text-[var(--color-muted-foreground)]/60">
              {formatRelativeTime(ann.createdAt)}
            </span>
          </div>
        </div>
        {isOpen ? (
          <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[8px] font-black text-emerald-800">{i18n.t('review:commentThread.open')}</span>
        ) : (
          <span className="rounded border border-[var(--color-border)] bg-[var(--color-background)] px-1.5 py-0.5 text-[8px] font-black text-[var(--color-muted-foreground)]">{i18n.t('review:commentThread.resolved')}</span>
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
              <UserAvatar size={24} name={reply.authorName ?? reply.authorId} className="shrink-0" />
              <div>
                <span className="text-[9px] font-bold text-[var(--color-foreground)]">
                  {reply.authorName ?? reply.authorId ?? i18n.t('review:commentThread.unknown')}
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
            placeholder={i18n.t('review:commentThread.writeAReply')}
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
              {i18n.t('review:commentThread.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-lg bg-[var(--color-primary)] py-1 text-[10px] font-bold text-white disabled:opacity-60"
            >
              {i18n.t('review:commentThread.send')}
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
              {i18n.t('review:commentThread.resolve')}
            </button>
          ) : (
            <button
              onClick={() => onReopen(annId)}
              className="cursor-pointer text-[10px] font-bold text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]"
            >
              {i18n.t('review:commentThread.reopen')}
            </button>
          )}
          <button
            onClick={() => onReplyOpen(annId)}
            className="cursor-pointer text-[10px] font-bold text-[var(--color-primary)] hover:underline"
          >
            {i18n.t('review:commentThread.reply')}
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
          title={i18n.t('review:commentThread.delete')}
        >
          <IconTrash />
        </button>
      </div>
    </div>
  );
}
