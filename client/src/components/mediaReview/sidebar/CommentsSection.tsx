import type { AnnotationFilter } from '../../../store/review/ReviewCoreStore';
import type { AnnotationWithShapes } from '../../../store/review/ImagePlayerStore';
import { IconChevronDown, IconSearch } from '../../imageReview/icons/ReviewIcons';
import { CommentThread } from './CommentThread';

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
  isExpanded: boolean;
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
  onToggleSection: () => void;
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
  isExpanded,
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
  onToggleSection,
}: CommentsSectionProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col border-b border-[hsl(244,30%,80%)]/20 p-5">
      <div
        className="mb-3 flex cursor-pointer select-none items-center justify-between"
        onClick={onToggleSection}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-[hsl(237,45%,30%)]">Feedback</h3>
          <span className="rounded-md bg-[hsl(246,72%,78%)]/20 px-1.5 py-0.5 text-[9px] font-black text-[hsl(237,45%,30%)]">
            {openCount} OPEN
          </span>
        </div>
        <span className={`text-[hsl(244,30%,80%)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <IconChevronDown />
        </span>
      </div>

      {isExpanded && (
        <div className="mt-2 flex min-h-0 flex-1 flex-col gap-3">
          <div className="space-y-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(244,30%,80%)]">
                <IconSearch />
              </span>
              <input
                type="text"
                placeholder="Search comments..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                className="w-full rounded-lg border border-[hsl(244,30%,80%)]/50 bg-[hsl(240,10%,96%)] py-1.5 pl-9 pr-3 text-xs text-[hsl(237,45%,30%)] placeholder:text-[hsl(244,10%,40%)]/60 outline-none transition-all focus:border-[hsl(240,30%,46%)] focus:ring-1 focus:ring-[hsl(240,30%,46%)]/20"
              />
            </div>
            <div className="flex gap-1.5 rounded-lg border border-[hsl(244,30%,80%)]/40 bg-[hsl(240,10%,96%)] p-0.5 text-[10px] font-bold">
              {(['ALL', 'OPEN', 'RESOLVED'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => onFilterChange(f)}
                  className={`flex-1 cursor-pointer rounded py-1 text-center transition-all ${
                    activeFilter === f
                      ? 'bg-white text-[hsl(237,45%,30%)] shadow-xs'
                      : 'text-[hsl(244,10%,40%)]'
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
            <div className="py-4 text-center text-xs text-[hsl(244,10%,40%)]">Loading comments…</div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
            {!isAnnotationsLoading && displayedAnnotations.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-[hsl(244,10%,40%)]">
                <svg className="h-8 w-8 text-[hsl(244,30%,80%)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-xs font-semibold">No comments found</span>
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
      )}
    </section>
  );
}
