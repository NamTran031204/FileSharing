import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { observer } from 'mobx-react-lite';
import type { ReviewCoreStore } from '../../store/review/ReviewCoreStore';
import type { AnnotationWithShapes } from '../../store/review/ImagePlayerStore';
import type { MediaAdapter } from './bridge/MediaAdapter';
import { ReviewHeader } from './layout/ReviewHeader';
import { ReviewSidebar } from './sidebar/ReviewSidebar';
import { IconChevronLeft, IconChevronRight } from '../imageReview/icons/ReviewIcons';
import type { SidebarSectionState } from '../imageReview/types';
import type { ImageViewDataDto } from '../../api/api/index.defs';

interface MarkupToolsConfig {
  activeTool: string;
  activeColor: string;
  strokeSize: number;
  onToolClick: (tool: 'rect' | 'circle' | 'arrow') => void;
  onColorChange: (c: string) => void;
  onStrokeSizeChange: (size: number) => void;
}

export interface MediaReviewLayoutProps {
  children: ReactNode;
  reviewStore: ReviewCoreStore;
  mediaAdapter: MediaAdapter;
  assetId: string;
  versionParam?: string | null;
  /** Called after version switch so the caller can clear drawn shapes etc. */
  onVersionChange?: () => void;
  /** Markup tools config passed from ImagePlayer (image-specific) */
  markupTools?: MarkupToolsConfig;
  /** Opens the A/B compare modal (image-specific) */
  onCompare?: () => void;
  /** imageData for the AssetInfoSection dimensions fallback */
  imageData?: ImageViewDataDto | null;
}

const DEFAULT_SECTIONS: SidebarSectionState = {
  shapes: true, comments: true, actionLog: true, imageInfo: true,
};

const MediaReviewLayout = observer(({
  children,
  reviewStore,
  mediaAdapter,
  assetId,
  versionParam,
  onVersionChange,
  markupTools,
  onCompare,
  imageData,
}: MediaReviewLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<SidebarSectionState>(DEFAULT_SECTIONS);
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

  const toggleSection = (section: keyof SidebarSectionState) =>
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[hsl(240,10%,96%)]">
      <ReviewHeader
        versions={reviewStore.versions}
        currentVersionNumber={reviewStore.currentVersionNumber}
        canGoPrev={currentVersionIdx > 0}
        canGoNext={currentVersionIdx < sortedVersions.length - 1}
        onPrev={handlePrev}
        onNext={handleNext}
        onSelectVersion={handleVersionSelect}
        onCompare={onCompare ?? (() => {})}
        reviewStatus={reviewStore.reviewStatus}
        isReviewLoading={reviewStore.isReviewLoading}
        onApprove={() => reviewStore.approveReview()}
        onRequestChanges={() => reviewStore.requestChanges()}
      />

      <div className="relative flex flex-1 overflow-hidden">
        {children}
        {!sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(true)}
            title="Hide sidebar"
            className="absolute right-[336px] top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md border border-[hsl(244,30%,80%)] bg-white text-[hsl(237,45%,30%)] shadow-sm transition-all hover:bg-[hsl(240,10%,96%)]"
          >
            <IconChevronRight />
          </button>
        )}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            title="Show sidebar"
            className="absolute right-2 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md border border-[hsl(244,30%,80%)]/40 bg-white/70 text-[hsl(237,45%,30%)] shadow-sm backdrop-blur-sm transition-all hover:bg-white"
          >
            <IconChevronLeft />
          </button>
        )}

        <ReviewSidebar
          sidebarCollapsed={sidebarCollapsed}
          expandedSections={expandedSections}
          onToggleSection={toggleSection}
          markupTools={markupTools ? {
            ...markupTools,
            isExpanded: expandedSections.shapes,
            onToggleSection: () => toggleSection('shapes'),
          } : {
            activeTool: '',
            activeColor: '#f43f5e',
            strokeSize: 4,
            isExpanded: false,
            onToolClick: () => {},
            onColorChange: () => {},
            onStrokeSizeChange: () => {},
            onToggleSection: () => toggleSection('shapes'),
          }}
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
          onHighlightToggle={id => {
            reviewStore.setHighlightedAnnotation(id);
            if (id) mediaAdapter.focusAnnotation(id);
          }}
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
        />
      </div>
    </div>
  );
});

export default MediaReviewLayout;
