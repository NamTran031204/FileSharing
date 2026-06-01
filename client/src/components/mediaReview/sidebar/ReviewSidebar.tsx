import type { AssetDetailResponseDto, ImageViewDataDto, MetadataEntity } from '../../../api/api/index.defs';
import type { AnnotationFilter } from '../../../store/review/ReviewCoreStore';
import type { AnnotationWithShapes } from '../../../store/review/ImagePlayerStore';
import { IconChevronDown } from '../../imageReview/icons/ReviewIcons';
import { STROKE_COLORS } from '../../imageReview/constants';
import { CommentsSection } from './CommentsSection';
import { ActionLogSection } from './ActionLogSection';
import { AssetInfoSection } from './AssetInfoSection';

interface MarkupToolsProps {
  activeTool: string;
  activeColor: string;
  strokeSize: number;
  isExpanded: boolean;
  onToolClick: (tool: 'rect' | 'circle' | 'arrow') => void;
  onColorChange: (c: string) => void;
  onStrokeSizeChange: (size: number) => void;
  onToggleSection: () => void;
}

interface SidebarSections {
  shapes: boolean;
  comments: boolean;
  actionLog: boolean;
  imageInfo: boolean;
}

export interface ReviewSidebarProps {
  sidebarCollapsed: boolean;
  expandedSections: SidebarSections;
  onToggleSection: (section: keyof SidebarSections) => void;

  markupTools: MarkupToolsProps;

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
}

export function ReviewSidebar({
  sidebarCollapsed,
  expandedSections,
  onToggleSection,
  markupTools,
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
}: ReviewSidebarProps) {
  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-l border-[hsl(244,30%,80%)]/30 bg-white transition-[width] duration-300 ${
        sidebarCollapsed ? 'w-0 overflow-hidden border-l-0' : 'w-80'
      }`}
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'thin' }}>

        {/* Markup Tools */}
        <section className="border-b border-[hsl(244,30%,80%)]/20 p-5">
          <div
            className="mb-3 flex cursor-pointer select-none items-center justify-between"
            onClick={() => onToggleSection('shapes')}
          >
            <h3 className="text-xs font-black uppercase tracking-wider text-[hsl(237,45%,30%)]">Markup Tools</h3>
            <span className={`text-[hsl(244,30%,80%)] transition-transform ${expandedSections.shapes ? 'rotate-180' : ''}`}>
              <IconChevronDown />
            </span>
          </div>

          {expandedSections.shapes && (
            <div className="mt-2 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-[hsl(244,30%,80%)]/20 bg-[hsl(240,10%,96%)] p-1">
                {[
                  { id: 'rect'   as const, label: 'Rectangle', dot: 'bg-rose-500'    },
                  { id: 'circle' as const, label: 'Circle',    dot: 'bg-emerald-500' },
                  { id: 'arrow'  as const, label: 'Arrow',     dot: 'bg-amber-500'   },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => markupTools.onToolClick(t.id)}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                      markupTools.activeTool === t.id
                        ? 'border border-[hsl(244,30%,80%)]/20 bg-white text-[hsl(240,30%,46%)] shadow-xs'
                        : 'text-[hsl(244,10%,40%)] hover:bg-white/40'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black tracking-wider text-[hsl(244,10%,40%)]">
                  <span>STROKE SIZE</span>
                  <span>{markupTools.strokeSize}px</span>
                </div>
                <input
                  type="range" min="1" max="16"
                  value={markupTools.strokeSize}
                  onChange={e => markupTools.onStrokeSizeChange(Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full border border-[hsl(244,30%,80%)]/10 bg-[hsl(240,10%,96%)] accent-[hsl(240,30%,46%)]"
                />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[hsl(244,10%,40%)]">STROKE COLOR</span>
                <div className="flex gap-2">
                  {STROKE_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => markupTools.onColorChange(c)}
                      className={`h-6 w-6 rounded-full border-2 transition-all hover:scale-110 ${
                        markupTools.activeColor === c ? 'scale-105 border-[hsl(237,45%,30%)]' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

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
          isExpanded={expandedSections.comments}
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
          onToggleSection={() => onToggleSection('comments')}
        />

        <ActionLogSection
          isExpanded={expandedSections.actionLog}
          onToggleSection={() => onToggleSection('actionLog')}
        />

        <AssetInfoSection
          isExpanded={expandedSections.imageInfo}
          onToggleSection={() => onToggleSection('imageInfo')}
          isVersionMetadataLoading={isVersionMetadataLoading}
          currentVersionMetadata={currentVersionMetadata}
          assetDetail={assetDetail}
          imageData={imageData}
        />

      </div>
    </aside>
  );
}
