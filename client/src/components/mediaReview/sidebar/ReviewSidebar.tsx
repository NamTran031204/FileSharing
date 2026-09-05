import type { AssetDetailResponseDto, ImageViewDataDto, MetadataEntity } from '../../../api/api/index.defs';
import type { AnnotationFilter } from '../../../store/review/ReviewCoreStore';
import type { AnnotationWithShapes } from '../../../store/review/ImagePlayerStore';
import { IconChevronLeft, IconChevronRight } from '../../imageReview/icons/ReviewIcons';
import { CommentsSection } from './CommentsSection';
import { ActionLogSection } from './ActionLogSection';
import { AssetInfoSection } from './AssetInfoSection';

export type ReviewSidebarTab = 'comments' | 'info' | 'activity';

export interface ReviewSidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  activeTab: ReviewSidebarTab;
  onTabChange: (tab: ReviewSidebarTab) => void;

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

  isVersionMetadataLoading: boolean;
  currentVersionMetadata: MetadataEntity | null;
  assetDetail: AssetDetailResponseDto | null;
  imageData: ImageViewDataDto | null;

  versions: MetadataEntity[];
  currentVersionNumber: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSelectVersion: (versionNumber: number) => void;
  reviewStatus: 'PENDING' | 'APPROVED' | 'REQUEST_CHANGES';
  isReviewLoading: boolean;
  onApprove: () => void;
  onRequestChanges: () => void;
  onCompare?: () => void;
  onDownload?: () => void;
}

const TABS: { id: ReviewSidebarTab; label: string }[] = [
  { id: 'comments', label: 'Comments' },
  { id: 'info', label: 'Info' },
  { id: 'activity', label: 'Activity' },
];

export function ReviewSidebar({
  collapsed,
  onToggleCollapsed,
  activeTab,
  onTabChange,
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
  isVersionMetadataLoading,
  currentVersionMetadata,
  assetDetail,
  imageData,
  versions,
  currentVersionNumber,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onSelectVersion,
  reviewStatus,
  isReviewLoading,
  onApprove,
  onRequestChanges,
  onCompare,
  onDownload,
}: ReviewSidebarProps) {
  return (
    <aside
      className={`relative flex h-full shrink-0 flex-col overflow-hidden border-l border-[var(--color-border)] bg-[var(--color-card)] transition-[width] duration-300 ${
        collapsed ? 'w-12' : 'w-80'
      }`}
    >
      <button
        onClick={onToggleCollapsed}
        title={collapsed ? 'Show sidebar' : 'Hide sidebar'}
        className="absolute top-1/2 z-30 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] shadow-md"
        style={{ left: -12 }}
      >
        {collapsed ? <IconChevronLeft /> : <IconChevronRight />}
      </button>

      {collapsed ? (
        <div className="flex flex-1 items-center justify-center text-[var(--color-muted-foreground)]">
          <span className="rotate-90 whitespace-nowrap text-[10px] font-black uppercase tracking-widest">Sidebar</span>
        </div>
      ) : (
        <>
          <div className="flex shrink-0 border-b border-[var(--color-border)]">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                title={t.id === 'activity' ? 'Mở rộng ngoài mockup gốc' : undefined}
                className={`flex-1 cursor-pointer border-b-2 py-2.5 text-xs font-bold transition-all ${
                  activeTab === t.id
                    ? 'border-[var(--color-primary)] text-[var(--color-foreground)]'
                    : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                }`}
              >
                {t.label}
                {t.id === 'activity' && <span className="ml-1 text-[var(--color-primary)]">•</span>}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {activeTab === 'comments' && (
              <CommentsSection
                displayedAnnotations={displayedAnnotations}
                allAnnotationsCount={allAnnotationsCount}
                activeFilter={activeFilter}
                openCount={openCount}
                resolvedCount={resolvedCount}
                isAnnotationsLoading={isAnnotationsLoading}
                annotationError={annotationError}
                highlightedAnnotationId={highlightedAnnotationId}
                expandedThreadIds={expandedThreadIds}
                isSaving={isSaving}
                searchQuery={searchQuery}
                replyingToId={replyingToId}
                replyText={replyText}
                onFilterChange={onFilterChange}
                onSearchChange={onSearchChange}
                onHighlightToggle={onHighlightToggle}
                onToggleExpand={onToggleExpand}
                onReplyOpen={onReplyOpen}
                onReplyTextChange={onReplyTextChange}
                onSubmitReply={onSubmitReply}
                onResolve={onResolve}
                onReopen={onReopen}
                onDelete={onDelete}
              />
            )}

            {activeTab === 'info' && (
              <AssetInfoSection
                isVersionMetadataLoading={isVersionMetadataLoading}
                currentVersionMetadata={currentVersionMetadata}
                assetDetail={assetDetail}
                imageData={imageData}
                versions={versions}
                currentVersionNumber={currentVersionNumber}
                canGoPrev={canGoPrev}
                canGoNext={canGoNext}
                onPrev={onPrev}
                onNext={onNext}
                onSelectVersion={onSelectVersion}
                reviewStatus={reviewStatus}
                isReviewLoading={isReviewLoading}
                onApprove={onApprove}
                onRequestChanges={onRequestChanges}
                onCompare={onCompare}
                onDownload={onDownload}
              />
            )}

            {activeTab === 'activity' && <ActionLogSection />}
          </div>
        </>
      )}
    </aside>
  );
}
