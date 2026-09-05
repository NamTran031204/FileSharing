import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { observer } from 'mobx-react-lite';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ReviewCoreStore } from '../../store/review/ReviewCoreStore';
import type { AnnotationWithShapes } from '../../store/review/ImagePlayerStore';
import type { MediaAdapter } from './bridge/MediaAdapter';
import { ReviewTopBar } from './layout/ReviewTopBar';
import type { ReviewParticipant } from './layout/ReviewTopBar';
import { LayersPanel } from './sidebar/LayersPanel';
import { ReviewSidebar } from './sidebar/ReviewSidebar';
import type { ReviewSidebarTab } from './sidebar/ReviewSidebar';
import { MediaType } from '../../api/api/index.defs';
import type { ImageViewDataDto } from '../../api/api/index.defs';
import { useStore } from '../../store';

export interface MediaReviewLayoutProps {
  children: ReactNode;
  reviewStore: ReviewCoreStore;
  mediaAdapter: MediaAdapter;
  assetId: string;
  versionParam?: string | null;
  /** Called after version switch so the caller can clear drawn shapes etc. */
  onVersionChange?: () => void;
  /** Opens the A/B compare modal (image-specific). Undefined disables the Compare button. */
  onCompare?: () => void;
  /** Undefined disables the Download button — no source download endpoint wired yet. */
  onDownload?: () => void;
  /** imageData for the AssetInfoSection dimensions fallback */
  imageData?: ImageViewDataDto | null;
  /** Slot phải của topbar: Image → zoom%, Video → "Viewing as …" + badge HLS */
  topBarRight?: ReactNode;
  /** Override cho nút back — mặc định: history-back nếu có, ngược lại về trang project */
  onBack?: () => void;
}

const MediaReviewLayout = observer(({
  children,
  reviewStore,
  mediaAdapter,
  assetId,
  versionParam,
  onVersionChange,
  onCompare,
  onDownload,
  imageData,
  topBarRight,
  onBack,
}: MediaReviewLayoutProps) => {
  const { sessionStore } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<ReviewSidebarTab>('comments');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (!assetId) return;
    reviewStore.init(assetId, versionParam ? parseInt(versionParam, 10) : undefined);
    return () => reviewStore.destroy();
  }, [assetId, versionParam, reviewStore]);

  const sortedVersions = [...reviewStore.versions].sort(
    (a, b) => (a.versionNumber ?? 0) - (b.versionNumber ?? 0),
  );
  const currentVersionIdx = sortedVersions.findIndex(
    v => v.versionNumber === reviewStore.currentVersionNumber,
  );

  const handleVersionSelect = (vn: number) => {
    reviewStore.switchVersion(vn);
    onVersionChange?.();
  };
  const handlePrev = () => {
    if (currentVersionIdx > 0) handleVersionSelect(sortedVersions[currentVersionIdx - 1].versionNumber!);
  };
  const handleNext = () => {
    if (currentVersionIdx < sortedVersions.length - 1) handleVersionSelect(sortedVersions[currentVersionIdx + 1].versionNumber!);
  };

  const displayedAnnotations: AnnotationWithShapes[] = (reviewStore.filteredAnnotations as AnnotationWithShapes[]).filter(ann => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ann.commentBody?.body?.toLowerCase().includes(q) ||
      (ann.authorName ?? ann.authorId ?? '').toLowerCase().includes(q)
    );
  });

  const handleSubmitReply = async (e: React.FormEvent, threadRootId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    const result = await reviewStore.addReply(threadRootId, replyText.trim());
    if (result) {
      setReplyText('');
      setReplyingToId(null);
    }
  };

  const handleHighlightToggle = (id: string | null) => {
    reviewStore.setHighlightedAnnotation(id);
    if (id) mediaAdapter.focusAnnotation(id);
  };

  // Participants — derive from annotation authors, không gọi API mới (quyết định A.2.1).
  const participants = useMemo<ReviewParticipant[]>(() => {
    const seen = new Map<string, ReviewParticipant>();
    for (const a of reviewStore.annotations) {
      const name = a.authorName ?? a.authorId;
      if (!name || seen.has(name)) continue;
      seen.set(name, { key: name, name, initials: name.slice(0, 2).toUpperCase() });
    }
    return [...seen.values()];
  }, [reviewStore.annotations]);

  const fileName =
    reviewStore.currentVersionMetadata?.fileName ??
    (reviewStore.assetDetail?.asset as { name?: string } | undefined)?.name;

  const handleBack = onBack ?? (() => {
    if (location.key !== 'default') navigate(-1);
    else navigate(`/projects/${sessionStore.currentProjectId}`);
  });

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[var(--color-background)]">
      <ReviewTopBar
        projectName={sessionStore.currentProjectName}
        fileName={fileName}
        participants={participants}
        onBack={handleBack}
        right={topBarRight}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <LayersPanel
          collapsed={leftCollapsed}
          onToggleCollapsed={() => setLeftCollapsed(v => !v)}
          annotations={reviewStore.filteredAnnotations}
          highlightedAnnotationId={reviewStore.highlightedAnnotationId}
          onHighlightToggle={handleHighlightToggle}
          variant={mediaAdapter.mediaType === MediaType.VIDEO ? 'video' : 'image'}
        />

        {children}

        <ReviewSidebar
          collapsed={rightCollapsed}
          onToggleCollapsed={() => setRightCollapsed(v => !v)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          displayedAnnotations={displayedAnnotations}
          allAnnotationsCount={(reviewStore.annotations as AnnotationWithShapes[]).length}
          activeFilter={reviewStore.activeFilter}
          openCount={reviewStore.openCount}
          resolvedCount={reviewStore.resolvedCount}
          isAnnotationsLoading={reviewStore.isAnnotationsLoading}
          annotationError={reviewStore.annotationError}
          highlightedAnnotationId={reviewStore.highlightedAnnotationId}
          expandedThreadIds={reviewStore.expandedThreadIds}
          isSaving={reviewStore.isSaving}
          searchQuery={searchQuery}
          replyingToId={replyingToId}
          replyText={replyText}
          onFilterChange={f => reviewStore.setActiveFilter(f)}
          onSearchChange={setSearchQuery}
          onHighlightToggle={handleHighlightToggle}
          onToggleExpand={id => reviewStore.toggleThreadExpanded(id)}
          onReplyOpen={id => setReplyingToId(id || null)}
          onReplyTextChange={setReplyText}
          onSubmitReply={handleSubmitReply}
          onResolve={id => reviewStore.resolveAnnotation(id)}
          onReopen={id => reviewStore.reopenAnnotation(id)}
          onDelete={id => reviewStore.deleteAnnotation(id)}
          isVersionMetadataLoading={reviewStore.isVersionMetadataLoading}
          currentVersionMetadata={reviewStore.currentVersionMetadata}
          assetDetail={reviewStore.assetDetail}
          imageData={imageData ?? null}
          versions={reviewStore.versions}
          currentVersionNumber={reviewStore.currentVersionNumber}
          canGoPrev={currentVersionIdx > 0}
          canGoNext={currentVersionIdx < sortedVersions.length - 1}
          onPrev={handlePrev}
          onNext={handleNext}
          onSelectVersion={handleVersionSelect}
          reviewStatus={reviewStore.reviewStatus}
          isReviewLoading={reviewStore.isReviewLoading}
          onApprove={() => reviewStore.approveReview()}
          onRequestChanges={() => reviewStore.requestChanges()}
          onCompare={onCompare}
          onDownload={onDownload}
        />
      </div>
    </div>
  );
});

export default MediaReviewLayout;
