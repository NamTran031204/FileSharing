import type { AnnotationFilter } from '../../../store/review/ReviewCoreStore';
import type { AnnotationWithShapes } from '../../../store/review/ImagePlayerStore';
import { IconSearch } from '../../imageReview/icons/ReviewIcons';
import { CommentThread } from './CommentThread';
import i18n from '../../../i18n';

interface CommentsSectionProps {
  displayedAnnotations: AnnotationWithShapes[];
  allAnnotationsCount: number;
  activeFilter: AnnotationFilter;
  openCount: number;
  resolvedCount: number;
  isAnnotationsLoading: boolean;
  annotationError: string | null;
  highlightedAnnotationId: string | null;
  expandedThreadIds: Set<string>;
  isSaving: boolean;
  searchQuery: string;
  replyingToId: string | null;
  replyText: string;
  onFilterChange: (f: AnnotationFilter) => void;
  onSearchChange: (q: string) => void;
  onHighlightToggle: (id: string | null) => void;
  onToggleExpand: (id: string) => void;
  onReplyOpen: (id: string) => void;
  onReplyTextChange: (text: string) => void;
  onSubmitReply: (e: React.FormEvent, threadRootId: string) => void;
  onResolve: (id: string) => void;
  onReopen: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CommentsSection({
  displayedAnnotations,
  allAnnotationsCount,
  activeFilter,
  openCount,
  resolvedCount,
  isAnnotationsLoading,
  annotationError,
  highlightedAnnotationId,
  expandedThreadIds,
  isSaving,
  searchQuery,
  replyingToId,
  replyText,
  onFilterChange,
  onSearchChange,
  onHighlightToggle,
  onToggleExpand,
  onReplyOpen,
  onReplyTextChange,
  onSubmitReply,
  onResolve,
  onReopen,
  onDelete,
}: CommentsSectionProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 p-4">
      <div className="space-y-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]">
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder={i18n.t('review:commentsSection.searchComments')}
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)]/50 bg-[var(--color-background)] py-1.5 pl-9 pr-3 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]/60 outline-none transition-all focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20"
          />
        </div>
        <div className="flex gap-1.5 rounded-lg border border-[var(--color-border)]/40 bg-[var(--color-background)] p-0.5 text-[10px] font-bold">
          {(['ALL', 'OPEN', 'RESOLVED'] as const).map(f => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`flex-1 cursor-pointer rounded py-1 text-center transition-all ${
                activeFilter === f
                  ? 'bg-[var(--color-card)] text-[var(--color-foreground)] shadow-xs'
                  : 'text-[var(--color-muted-foreground)]'
              }`}
            >
              {f === 'ALL'
                ? `All (${allAnnotationsCount})`
                : f === 'OPEN'
                ? `Open (${openCount})`
                : `Resolved (${resolvedCount})`}
            </button>
          ))}
        </div>
      </div>

      {annotationError && (
        <p className="rounded-lg bg-rose-50 p-2 text-[10px] text-rose-600">{annotationError}</p>
      )}

      {isAnnotationsLoading && (
        <div className="py-4 text-center text-xs text-[var(--color-muted-foreground)]">{i18n.t('review:commentsSection.loadingComments')}</div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
        {!isAnnotationsLoading && displayedAnnotations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-[var(--color-muted-foreground)]">
            <svg className="h-8 w-8 text-[var(--color-border)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs font-semibold">{i18n.t('review:commentsSection.noCommentsFound')}</span>
          </div>
        ) : (
          displayedAnnotations.map(ann => (
            <CommentThread
              key={ann.annotationId}
              ann={ann}
              isHighlighted={highlightedAnnotationId === ann.annotationId}
              isExpanded={expandedThreadIds.has(ann.annotationId ?? '')}
              replyingToId={replyingToId}
              replyText={replyText}
              isSaving={isSaving}
              onHighlightToggle={onHighlightToggle}
              onReplyOpen={onReplyOpen}
              onReplyTextChange={onReplyTextChange}
              onSubmitReply={onSubmitReply}
              onResolve={onResolve}
              onReopen={onReopen}
              onDelete={onDelete}
              onToggleExpand={onToggleExpand}
            />
          ))
        )}
      </div>
    </div>
  );
}
