import { useCallback, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Circle, Image as KonvaImage, Layer, Rect, Stage, Transformer } from 'react-konva';
import type Konva from 'konva';
import useImage from 'use-image';
import { useSearchParams } from 'react-router-dom';
import CommonLayout from '../layout/CommonLayout';
import { mockActionLog } from '../components/imageReview/mockData';
import type { SidebarSectionState } from '../components/imageReview/types';
import useKonvaCanvas from '../hooks/useKonvaCanvas';
import type { MarkupMode, ShapeTool } from '../hooks/useKonvaCanvas';
import { useStore } from '../store';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(isoDate?: string | null): string {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  const now = new Date();
  const hours = Math.floor((now.getTime() - d.getTime()) / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function formatBytes(bytes?: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_STROKE_SIZE = 4;
const STROKE_COLORS = ['#f43f5e', '#10b981', '#f59e0b', '#0ea5e9', '#535297'] as const;
type StrokeColor = (typeof STROKE_COLORS)[number];

// ─── Inline SVG icons ────────────────────────────────────────────────────────
const IconSelect = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 3 10.07 19.97 12.58 12.58 19.97 10.07 3 3" /><line x1="13" y1="13" x2="19" y2="19" />
  </svg>
);
const IconRect = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
  </svg>
);
const IconCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
  </svg>
);
const IconArrow = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const IconPan = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);
const IconUndo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);
const IconRedo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 0-2.13-9.36L23 10" />
  </svg>
);
const IconZoomIn = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);
const IconZoomOut = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);
const IconEye = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const IconEyeOff = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const IconChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconDiff = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const IconDownload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const IconMore = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
  </svg>
);
const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Main Page ───────────────────────────────────────────────────────────────
const ImageReviewPage = observer(() => {
  const [searchParams] = useSearchParams();
  const assetId = searchParams.get('assetId');
  const versionParam = searchParams.get('version');

  const { imageReviewStore: store } = useStore();

  // ── Init / cleanup ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!assetId) return;
    store.init(assetId, versionParam ? parseInt(versionParam, 10) : undefined);
    return () => store.destroy();
  }, [assetId, versionParam, store]);

  // ── Version navigation ─────────────────────────────────────────────────────
  const sortedVersions = [...store.versions].sort(
    (a, b) => (a.versionNumber ?? 0) - (b.versionNumber ?? 0),
  );
  const currentVersionIdx = sortedVersions.findIndex(
    v => v.versionNumber === store.currentVersionNumber,
  );
  const canGoPrev = currentVersionIdx > 0;
  const canGoNext = currentVersionIdx < sortedVersions.length - 1;

  const [activeMode, setActiveMode] = useState<MarkupMode>('select');
  const [activeShape, setActiveShape] = useState<ShapeTool>('rectangle');
  const [activeColor, setActiveColor] = useState<StrokeColor>('#f43f5e');
  const [strokeSize, setStrokeSize] = useState(DEFAULT_STROKE_SIZE);

  const activePreviewUrl = store.imageData?.previewUrl ?? '';
  const [bgImage] = useImage(activePreviewUrl);

  const {
    containerRef,
    containerWidth,
    containerHeight,
    stageRef,
    transformerRef,
    shapeRefs,
    stageScale,
    stagePosition,
    setStageScale,
    setStagePosition,
    selectedTool,
    setSelectedTool,
    drawnShapes,
    setDrawnShapes,
    setSelectedShapeId,
    isDrawing,
    startPoint,
    currentPoint,
    handlers: {
      handleStageMouseDown,
      handleStageMouseMove,
      handleStageWheel,
      handleStageDragEnd,
      handleZoomIn,
      handleZoomOut,
      handleDragEnd,
      handleTransformEnd,
    },
    helpers: { getCircleProps, getRectProps },
    zoomPercent,
  } = useKonvaCanvas({
    worldWidth: bgImage?.width,
    worldHeight: bgImage?.height,
  });

  // ── Scale factors: set in store after preview image loads ──────────────────
  useEffect(() => {
    if (!bgImage || !store.imageData?.dimensions?.width || !store.imageData?.dimensions?.height) return;
    store.setScaleFactors(
      bgImage.width / store.imageData.dimensions.width,
      bgImage.height / store.imageData.dimensions.height,
    );
  }, [bgImage, store.imageData, store]);

  // ── Sidebar & section state ────────────────────────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<SidebarSectionState>({
    shapes: true,
    comments: true,
    actionLog: true,
    imageInfo: true,
  });

  // ── Local search query (UI-only, stacked on top of store filter) ───────────
  const [searchQuery, setSearchQuery] = useState('');

  // ── Reply state ────────────────────────────────────────────────────────────
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // ── Compare modal ──────────────────────────────────────────────────────────
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareSliderPos, setCompareSliderPos] = useState(50);

  // ── Comment popup (after shape draw) ──────────────────────────────────────
  const [commentPopup, setCommentPopup] = useState<{ x: number; y: number } | null>(null);
  const [commentText, setCommentText] = useState('');
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const pendingShapeIdRef = useRef<string | null>(null);

  const viewportDivRef = useRef<HTMLDivElement>(null);

  // ── Zoom fit / zoom 100% ───────────────────────────────────────────────────
  const handleZoomFit = useCallback(() => {
    if (!bgImage || containerWidth <= 0 || containerHeight <= 0) return;
    const scaleX = containerWidth / bgImage.width;
    const scaleY = containerHeight / bgImage.height;
    const fitScale = Math.min(scaleX, scaleY) * 0.9;
    setStageScale(fitScale);
    setStagePosition({
      x: (containerWidth - bgImage.width * fitScale) / 2,
      y: (containerHeight - bgImage.height * fitScale) / 2,
    });
  }, [bgImage, containerWidth, containerHeight, setStageScale, setStagePosition]);

  const handleZoom100 = useCallback(() => {
    if (containerWidth <= 0 || containerHeight <= 0) return;
    setStageScale(1);
    setStagePosition({
      x: containerWidth / 2 - (bgImage?.width ?? 0) / 2,
      y: containerHeight / 2 - (bgImage?.height ?? 0) / 2,
    });
  }, [bgImage, containerWidth, containerHeight, setStageScale, setStagePosition]);

  // ── Comment popup: fires when isDrawing transitions true→false ─────────────
  const prevIsDrawing = useRef(false);
  useEffect(() => {
    if (prevIsDrawing.current && !isDrawing && (selectedTool === 'rect' || selectedTool === 'circle')) {
      pendingShapeIdRef.current = drawnShapes[drawnShapes.length - 1]?.id ?? null;
      const stage = stageRef.current;
      const pos = stage?.getPointerPosition();
      if (pos) {
        const rect = stage?.container().getBoundingClientRect();
        setCommentPopup({
          x: (rect?.left ?? 0) + pos.x,
          y: (rect?.top ?? 0) + pos.y,
        });
        setCommentText('');
        setTimeout(() => commentInputRef.current?.focus(), 50);
      }
    }
    prevIsDrawing.current = isDrawing;
  }, [isDrawing, selectedTool, stageRef, drawnShapes]);

  const handleCloseCommentPopup = () => {
    if (pendingShapeIdRef.current) {
      const id = pendingShapeIdRef.current;
      setDrawnShapes(prev => prev.filter(s => s.id !== id));
      pendingShapeIdRef.current = null;
    }
    setCommentPopup(null);
    setCommentText('');
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !assetId) return;
    const pendingShapeId = pendingShapeIdRef.current;
    const pendingShape = pendingShapeId ? drawnShapes.find(s => s.id === pendingShapeId) : null;
    const shapes = pendingShape ? [pendingShape] : [];
    const result = await store.createAnnotation(commentText.trim(), shapes);
    if (result) {
      if (pendingShapeId) {
        setDrawnShapes(prev => prev.filter(s => s.id !== pendingShapeId));
      }
      pendingShapeIdRef.current = null;
      setCommentPopup(null);
      setCommentText('');
    }
  };

  const handleSubmitReply = async (e: React.FormEvent, threadRootId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    const result = await store.addReply(threadRootId, replyText.trim());
    if (result) {
      setReplyText('');
      setReplyingToId(null);
    }
  };

  // ── Tool mode sync → useKonvaCanvas ───────────────────────────────────────
  useEffect(() => {
    if (activeMode === 'select') { setSelectedTool('select'); return; }
    if (activeMode === 'text')   { setSelectedTool('pan');    return; }
    if (activeMode === 'draw') {
      if (activeShape === 'circle')        setSelectedTool('circle');
      else if (activeShape === 'rectangle') setSelectedTool('rect');
      else setSelectedTool('rotate');
    }
  }, [activeMode, activeShape, setSelectedTool]);

  // ── Version navigation handlers ────────────────────────────────────────────
  const handlePrevVersion = () => {
    if (!canGoPrev) return;
    store.switchVersion(sortedVersions[currentVersionIdx - 1].versionNumber!);
    setDrawnShapes([]);
    setSelectedShapeId(null);
  };

  const handleNextVersion = () => {
    if (!canGoNext) return;
    store.switchVersion(sortedVersions[currentVersionIdx + 1].versionNumber!);
    setDrawnShapes([]);
    setSelectedShapeId(null);
  };

  // ── Section accordion ──────────────────────────────────────────────────────
  const toggleSection = (section: keyof SidebarSectionState) =>
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));

  // ── Toolbar tool selection ─────────────────────────────────────────────────
  const handleToolClick = (tool: 'select' | 'rect' | 'circle' | 'arrow' | 'pan') => {
    if (tool === 'select')      setActiveMode('select');
    else if (tool === 'pan')    setActiveMode('text');
    else if (tool === 'rect')   { setActiveMode('draw'); setActiveShape('rectangle'); }
    else if (tool === 'circle') { setActiveMode('draw'); setActiveShape('circle'); }
    else if (tool === 'arrow')  { setActiveMode('draw'); setActiveShape('gesture'); }
    setSelectedShapeId(null);
  };

  // ── Derived UI values ──────────────────────────────────────────────────────
  const activeTool =
    selectedTool === 'pan'    ? 'pan'
    : selectedTool === 'select' ? 'select'
    : selectedTool === 'rect'   ? 'rect'
    : selectedTool === 'circle' ? 'circle'
    : 'arrow';

  const viewportCursor =
    selectedTool === 'select' ? 'default'
    : selectedTool === 'pan'  ? 'grab'
    : 'crosshair';

  const reviewStatus = store.reviewStatus;
  const reviewStatusClass =
    reviewStatus === 'APPROVED'         ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
    : reviewStatus === 'REQUEST_CHANGES' ? 'bg-rose-100 text-rose-800 border-rose-200'
    : 'bg-amber-100 text-amber-800 border-amber-200';

  // ── Filtered comments (store filter + local search) ────────────────────────
  const displayedAnnotations = store.filteredAnnotations.filter(ann => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ann.commentBody?.body?.toLowerCase().includes(q) ||
      (ann.authorName ?? ann.authorId ?? '').toLowerCase().includes(q)
    );
  });

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <CommonLayout>
      <div className="flex h-full flex-col overflow-hidden bg-[hsl(240,10%,96%)]">

        {/* ══ SUB HEADER ════════════════════════════════════════════════════ */}
        <div className="z-10 flex h-14 shrink-0 items-center justify-between border-b border-[hsl(244,30%,80%)]/20 bg-white px-6">
          <div className="flex items-center gap-4">

            {/* Version prev/next navigation */}
            <div className="flex items-center rounded-lg border border-[hsl(244,30%,80%)]/30 bg-[hsl(240,10%,96%)] p-1 shadow-xs">
              <button
                onClick={handlePrevVersion}
                disabled={!canGoPrev}
                className="rounded p-1 text-[hsl(237,45%,30%)] transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                title="Previous Version"
              >
                <IconChevronLeft />
              </button>
              <span className="min-w-[50px] select-none px-3 text-center text-xs font-black text-[hsl(237,45%,30%)]">
                {sortedVersions.length > 0 ? `${currentVersionIdx + 1} / ${sortedVersions.length}` : '— / —'}
              </span>
              <button
                onClick={handleNextVersion}
                disabled={!canGoNext}
                className="rounded p-1 text-[hsl(237,45%,30%)] transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                title="Next Version"
              >
                <IconChevronRight />
              </button>
            </div>

            {/* Version selector dropdown */}
            <div className="group relative">
              <button className="flex cursor-pointer items-center gap-2 rounded-lg border border-[hsl(244,30%,80%)]/30 bg-[hsl(240,10%,96%)] px-3 py-1.5 text-xs font-bold text-[hsl(237,45%,30%)] transition-all hover:border-[hsl(240,30%,46%)]">
                <IconClock />
                <span>v{store.currentVersionNumber}</span>
                <IconChevronDown />
              </button>
              <div className="absolute left-0 top-full z-30 mt-1 hidden w-44 rounded-lg border border-[hsl(244,30%,80%)]/35 bg-white py-1 shadow-xl group-hover:block">
                {sortedVersions.slice().reverse().map(v => (
                  <button
                    key={v.versionNumber}
                    onClick={() => {
                      store.switchVersion(v.versionNumber!);
                      setDrawnShapes([]);
                      setSelectedShapeId(null);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2 text-left text-xs font-bold hover:bg-[hsl(240,10%,96%)] ${
                      v.versionNumber === store.currentVersionNumber
                        ? 'text-[hsl(240,30%,46%)]'
                        : 'text-[hsl(244,10%,40%)]'
                    }`}
                  >
                    <span>v{v.versionNumber}{v.versionNumber === store.currentVersionNumber ? ' (Current)' : ''}</span>
                    {v.versionNumber === store.currentVersionNumber && <IconCheck />}
                  </button>
                ))}
                {sortedVersions.length === 0 && (
                  <div className="px-4 py-2 text-xs text-[hsl(244,10%,40%)]">Loading…</div>
                )}
              </div>
            </div>

            {/* Compare button */}
            <button
              onClick={() => setShowCompareModal(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[hsl(246,72%,78%)]/20 bg-[hsl(246,72%,78%)]/10 px-3 py-1.5 text-xs font-bold text-[hsl(240,30%,46%)] shadow-xs transition-all hover:bg-[hsl(246,72%,78%)]/20"
            >
              <IconDiff />
              <span>Compare</span>
            </button>

          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest shadow-xs ${reviewStatusClass}`}>
              {reviewStatus.replace('_', ' ')}
            </span>

            <button
              onClick={() => store.approveReview()}
              disabled={store.isReviewLoading}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-60"
            >
              <span className="rounded-full bg-emerald-500 p-0.5"><IconCheck /></span>
              <span>Approve</span>
            </button>

            <button
              onClick={() => store.requestChanges()}
              disabled={store.isReviewLoading}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-rose-700 disabled:opacity-60"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>Request Changes</span>
            </button>

            <div className="h-6 w-px bg-[hsl(244,30%,80%)]/20" />

            <button
              className="cursor-pointer rounded-lg p-2 text-[hsl(237,45%,30%)] transition-all hover:bg-[hsl(240,30%,46%)]/10"
              title="Download Source Asset"
            >
              <IconDownload />
            </button>
            <button className="cursor-pointer rounded-lg p-2 text-[hsl(237,45%,30%)] transition-all hover:bg-[hsl(240,30%,46%)]/10" title="More Actions">
              <IconMore />
            </button>
          </div>
        </div>

        {/* ══ REVIEW WORKSPACE ══════════════════════════════════════════════ */}
        <div className="relative flex flex-1 overflow-hidden">

          {/* ── VIEWPORT (dark canvas) ──────────────────────────────────── */}
          <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-zinc-950">

            {/* Floating left toolbar */}
            <div className="absolute left-4 top-4 z-10 flex flex-col gap-1.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/90 p-1.5 shadow-2xl">
              {(
                [
                  { id: 'select', Icon: IconSelect, label: 'SELECT', title: 'Select (V)' },
                  { id: 'rect',   Icon: IconRect,   label: 'RECT',   title: 'Rectangle (R)' },
                  { id: 'circle', Icon: IconCircle, label: 'CIRCLE', title: 'Circle (O)' },
                  { id: 'arrow',  Icon: IconArrow,  label: 'ARROW',  title: 'Arrow (A)' },
                  { id: 'pan',    Icon: IconPan,    label: 'PAN',    title: 'Pan (H)' },
                ] as const
              ).map(({ id, Icon, label, title }) => (
                <button
                  key={id}
                  onClick={() => handleToolClick(id)}
                  title={title}
                  className={`flex h-10 w-10 flex-col items-center justify-center rounded-xl transition-all ${
                    activeTool === id
                      ? 'bg-[hsl(240,30%,46%)] text-white'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <Icon />
                  <span className="mt-0.5 text-[7px] font-black">{label}</span>
                </button>
              ))}

              <div className="mx-1.5 my-1 h-px bg-zinc-800" />

              <button
                title="Delete Selected (Del)"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-rose-950/80 hover:text-rose-400"
              >
                <IconTrash />
              </button>
              <button title="Undo" className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-zinc-800 hover:text-white">
                <IconUndo />
              </button>
              <button title="Redo" className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-zinc-800 hover:text-white">
                <IconRedo />
              </button>

              {/* Color picker swatch */}
              <div className="group/color relative flex h-10 w-10 cursor-pointer items-center justify-center">
                <div className="h-5 w-5 rounded-full border border-white/50" style={{ backgroundColor: activeColor }} />
                <div className="absolute left-full top-0 z-30 ml-2 hidden flex-col gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 p-2 shadow-2xl group-hover/color:flex">
                  <span className="mb-1 text-[9px] font-black uppercase tracking-wider text-zinc-500">COLOR</span>
                  <div className="flex gap-1.5">
                    {STROKE_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setActiveColor(c)}
                        title={c}
                        className={`h-6 w-6 rounded-full border-2 transition-all hover:scale-110 ${
                          activeColor === c ? 'scale-105 border-white' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Konva canvas viewport */}
            <div
              ref={el => {
                (containerRef as React.RefCallback<HTMLDivElement>)(el);
                (viewportDivRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
              }}
              className="relative flex w-full flex-1 items-center justify-center overflow-hidden"
              style={{ cursor: viewportCursor }}
            >
              {(store.isImageLoading || store.isInitialLoading) && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/60">
                  <div className="text-sm text-zinc-400">Loading image…</div>
                </div>
              )}

              {containerWidth > 0 && containerHeight > 0 && (
                <Stage
                  ref={stageRef}
                  width={containerWidth}
                  height={containerHeight}
                  onMouseDown={handleStageMouseDown}
                  onMouseMove={handleStageMouseMove}
                  onWheel={handleStageWheel}
                  scale={{ x: stageScale, y: stageScale }}
                  position={stagePosition}
                  draggable={selectedTool === 'pan'}
                  onDragEnd={handleStageDragEnd}
                >
                  <Layer>
                    {bgImage && <KonvaImage image={bgImage} x={0} y={0} />}

                    {/* Saved annotation shapes (from store) */}
                    {store.showAnnotations && store.allKonvaShapes.map(shape => {
                      const isHl = !store.highlightedAnnotationId ||
                        shape.annotationId === store.highlightedAnnotationId;
                      const opacity = isHl ? 1 : 0.35;
                      const onClick = () =>
                        store.setHighlightedAnnotation(
                          store.highlightedAnnotationId === shape.annotationId
                            ? null
                            : (shape.annotationId ?? null),
                        );
                      if (shape.type === 'circle') {
                        return (
                          <Circle
                            key={shape.id}
                            x={shape.x} y={shape.y}
                            radius={shape.radius}
                            stroke={shape.stroke}
                            strokeWidth={shape.strokeWidth}
                            opacity={opacity}
                            onClick={onClick}
                          />
                        );
                      }
                      return (
                        <Rect
                          key={shape.id}
                          x={shape.x} y={shape.y}
                          width={shape.width} height={shape.height}
                          stroke={shape.stroke}
                          strokeWidth={shape.strokeWidth}
                          opacity={opacity}
                          onClick={onClick}
                        />
                      );
                    })}

                    {/* Locally drawn shapes (pending save) */}
                    {drawnShapes.map(shape => {
                      const isDraggable = selectedTool === 'select';
                      if (shape.type === 'circle') {
                        return (
                          <Circle
                            key={shape.id}
                            x={shape.x} y={shape.y}
                            radius={shape.radius}
                            rotation={shape.rotation ?? 0}
                            stroke={shape.stroke}
                            strokeWidth={shape.strokeWidth}
                            draggable={isDraggable}
                            onClick={() => selectedTool === 'select' && setSelectedShapeId(shape.id)}
                            onTap={() => selectedTool === 'select' && setSelectedShapeId(shape.id)}
                            ref={node => { shapeRefs.current[shape.id] = node; }}
                            onDragEnd={e => handleDragEnd(shape.id, e)}
                            onTransformEnd={e => handleTransformEnd(shape.id, e.target as Konva.Shape)}
                          />
                        );
                      }
                      return (
                        <Rect
                          key={shape.id}
                          x={shape.x} y={shape.y}
                          width={shape.width} height={shape.height}
                          rotation={shape.rotation ?? 0}
                          stroke={shape.stroke}
                          strokeWidth={shape.strokeWidth}
                          draggable={isDraggable}
                          onClick={() => selectedTool === 'select' && setSelectedShapeId(shape.id)}
                          onTap={() => selectedTool === 'select' && setSelectedShapeId(shape.id)}
                          ref={node => { shapeRefs.current[shape.id] = node; }}
                          onDragEnd={e => handleDragEnd(shape.id, e)}
                          onTransformEnd={e => handleTransformEnd(shape.id, e.target as Konva.Shape)}
                        />
                      );
                    })}

                    <Transformer
                      ref={transformerRef}
                      rotateEnabled={selectedTool === 'rotate'}
                      enabledAnchors={[]}
                      ignoreStroke
                      keepRatio
                    />

                    {/* Live drawing preview */}
                    {isDrawing && startPoint && currentPoint && (
                      <>
                        {selectedTool === 'circle' && (
                          <Circle
                            {...getCircleProps(startPoint, currentPoint)}
                            stroke={activeColor}
                            strokeWidth={strokeSize}
                            dash={[5, 5]}
                            opacity={0.7}
                          />
                        )}
                        {selectedTool === 'rect' && (
                          <Rect
                            {...getRectProps(startPoint, currentPoint)}
                            stroke={activeColor}
                            strokeWidth={strokeSize}
                            dash={[5, 5]}
                            opacity={0.7}
                          />
                        )}
                      </>
                    )}
                  </Layer>
                </Stage>
              )}
            </div>

            {/* Comment popup overlay (after shape draw) */}
            {commentPopup && (
              <div
                className="fixed z-50 w-72 rounded-xl border border-[hsl(244,30%,80%)] bg-white p-4 shadow-2xl"
                style={{
                  top: Math.min(window.innerHeight - 260, Math.max(80, commentPopup.y - 120)),
                  left: Math.min(window.innerWidth - 320, Math.max(60, commentPopup.x + 16)),
                }}
              >
                <div className="mb-3 flex items-center justify-between border-b border-[hsl(244,30%,80%)]/30 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[hsl(237,45%,30%)]">New Comment</span>
                  <button
                    onClick={handleCloseCommentPopup}
                    className="rounded p-0.5 text-[hsl(244,10%,40%)] hover:text-[hsl(237,45%,30%)]"
                  >
                    <IconX />
                  </button>
                </div>
                <form onSubmit={handleSubmitComment} className="flex flex-col gap-2">
                  <textarea
                    ref={commentInputRef}
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Type a comment… use @ to mention"
                    rows={3}
                    className="w-full resize-none rounded-lg border border-[hsl(244,30%,80%)]/50 bg-[hsl(240,10%,96%)] p-2.5 text-xs text-[hsl(237,45%,30%)] outline-none transition-all placeholder:text-[hsl(244,10%,40%)]/50 focus:border-[hsl(240,30%,46%)] focus:ring-1 focus:ring-[hsl(240,30%,46%)]/20"
                  />
                  {store.annotationError && (
                    <p className="text-[10px] text-red-500">{store.annotationError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCloseCommentPopup}
                      className="flex-1 rounded-lg border border-[hsl(244,30%,80%)]/40 bg-[hsl(240,10%,96%)] py-1.5 text-xs font-bold text-[hsl(237,45%,30%)] transition-all hover:bg-[hsl(244,30%,80%)]/20"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={store.isSaving}
                      className="flex-1 rounded-lg bg-[hsl(240,30%,46%)] py-1.5 text-xs font-bold text-white transition-all hover:bg-[hsl(244,30%,61%)] disabled:opacity-60"
                    >
                      {store.isSaving ? 'Saving…' : 'Post'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Bottom floating capsule controls */}
            <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/95 px-5 py-2.5 text-white shadow-2xl">
              <button
                onClick={() => handleToolClick(activeTool === 'pan' ? 'select' : 'pan')}
                title="Pan Mode"
                className={`rounded-lg p-1.5 transition-all hover:bg-zinc-800 ${activeTool === 'pan' ? 'bg-zinc-800 text-[hsl(246,72%,78%)]' : 'text-zinc-400'}`}
              >
                <IconPan />
              </button>

              <div className="h-5 w-px bg-zinc-800" />

              <div className="flex items-center gap-2">
                <button onClick={handleZoomOut} title="Zoom Out" className="rounded-lg p-1.5 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white">
                  <IconZoomOut />
                </button>
                <span className="w-12 select-none text-center text-xs font-bold tracking-widest text-zinc-300">
                  {zoomPercent}%
                </span>
                <button onClick={handleZoomIn} title="Zoom In" className="rounded-lg p-1.5 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white">
                  <IconZoomIn />
                </button>
              </div>

              <div className="h-5 w-px bg-zinc-800" />

              <button
                onClick={handleZoomFit}
                title="Fit to screen"
                className="rounded-lg px-2.5 py-1 text-[10px] font-black tracking-wider text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white"
              >
                FIT
              </button>
              <button
                onClick={handleZoom100}
                title="Reset to 100%"
                className="rounded-lg px-2.5 py-1 text-[10px] font-black tracking-wider text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white"
              >
                100%
              </button>

              <div className="h-5 w-px bg-zinc-800" />

              <button
                onClick={() => store.toggleAnnotationVisibility()}
                title={store.showAnnotations ? 'Hide Annotations' : 'Show Annotations'}
                className={`rounded-lg p-1.5 transition-all hover:bg-zinc-800 ${store.showAnnotations ? 'text-[hsl(246,72%,78%)]' : 'text-zinc-500'}`}
              >
                {store.showAnnotations ? <IconEye /> : <IconEyeOff />}
              </button>
            </div>
          </div>

          {/* Sidebar toggle buttons */}
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

          {/* ── RIGHT SIDEBAR ──────────────────────────────────────────── */}
          <aside
            className={`flex h-full shrink-0 flex-col border-l border-[hsl(244,30%,80%)]/30 bg-white transition-[width] duration-300 ${
              sidebarCollapsed ? 'w-0 overflow-hidden border-l-0' : 'w-80'
            }`}
          >
            <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'thin' }}>

              {/* ─ Markup Tools ─────────────────────────────────────────── */}
              <section className="border-b border-[hsl(244,30%,80%)]/20 p-5">
                <div
                  className="mb-3 flex cursor-pointer select-none items-center justify-between"
                  onClick={() => toggleSection('shapes')}
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
                          onClick={() => handleToolClick(t.id)}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                            activeTool === t.id
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
                        <span>{strokeSize}px</span>
                      </div>
                      <input
                        type="range" min="1" max="16"
                        value={strokeSize}
                        onChange={e => setStrokeSize(Number(e.target.value))}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-full border border-[hsl(244,30%,80%)]/10 bg-[hsl(240,10%,96%)] accent-[hsl(240,30%,46%)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[hsl(244,10%,40%)]">STROKE COLOR</span>
                      <div className="flex gap-2">
                        {STROKE_COLORS.map(c => (
                          <button
                            key={c}
                            onClick={() => setActiveColor(c)}
                            className={`h-6 w-6 rounded-full border-2 transition-all hover:scale-110 ${
                              activeColor === c ? 'scale-105 border-[hsl(237,45%,30%)]' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* ─ Feedback / Comments ──────────────────────────────────── */}
              <section className="flex min-h-0 flex-1 flex-col border-b border-[hsl(244,30%,80%)]/20 p-5">
                <div
                  className="mb-3 flex cursor-pointer select-none items-center justify-between"
                  onClick={() => toggleSection('comments')}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[hsl(237,45%,30%)]">Feedback</h3>
                    <span className="rounded-md bg-[hsl(246,72%,78%)]/20 px-1.5 py-0.5 text-[9px] font-black text-[hsl(237,45%,30%)]">
                      {store.openCount} OPEN
                    </span>
                  </div>
                  <span className={`text-[hsl(244,30%,80%)] transition-transform ${expandedSections.comments ? 'rotate-180' : ''}`}>
                    <IconChevronDown />
                  </span>
                </div>

                {expandedSections.comments && (
                  <div className="mt-2 flex min-h-0 flex-1 flex-col gap-3">
                    {/* Search & filter tabs */}
                    <div className="space-y-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(244,30%,80%)]">
                          <IconSearch />
                        </span>
                        <input
                          type="text"
                          placeholder="Search comments..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full rounded-lg border border-[hsl(244,30%,80%)]/50 bg-[hsl(240,10%,96%)] py-1.5 pl-9 pr-3 text-xs text-[hsl(237,45%,30%)] placeholder:text-[hsl(244,10%,40%)]/60 outline-none transition-all focus:border-[hsl(240,30%,46%)] focus:ring-1 focus:ring-[hsl(240,30%,46%)]/20"
                        />
                      </div>
                      <div className="flex gap-1.5 rounded-lg border border-[hsl(244,30%,80%)]/40 bg-[hsl(240,10%,96%)] p-0.5 text-[10px] font-bold">
                        {(['ALL', 'OPEN', 'RESOLVED'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => store.setActiveFilter(f)}
                            className={`flex-1 cursor-pointer rounded py-1 text-center transition-all ${
                              store.activeFilter === f
                                ? 'bg-white text-[hsl(237,45%,30%)] shadow-xs'
                                : 'text-[hsl(244,10%,40%)]'
                            }`}
                          >
                            {f === 'ALL'
                              ? `All (${store.annotations.length})`
                              : f === 'OPEN'
                              ? `Open (${store.openCount})`
                              : `Resolved (${store.resolvedCount})`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Annotation error */}
                    {store.annotationError && (
                      <p className="rounded-lg bg-rose-50 p-2 text-[10px] text-rose-600">{store.annotationError}</p>
                    )}

                    {/* Loading state */}
                    {store.isAnnotationsLoading && (
                      <div className="py-4 text-center text-xs text-[hsl(244,10%,40%)]">Loading comments…</div>
                    )}

                    {/* Comments list */}
                    <div className="flex-1 space-y-3 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                      {!store.isAnnotationsLoading && displayedAnnotations.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-8 text-center text-[hsl(244,10%,40%)]">
                          <svg className="h-8 w-8 text-[hsl(244,30%,80%)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span className="text-xs font-semibold">No comments found</span>
                        </div>
                      ) : (
                        displayedAnnotations.map(ann => {
                          const isHighlighted = store.highlightedAnnotationId === ann.annotationId;
                          const isOpen = ann.status === 'OPEN';
                          const authorInitials = (ann.authorName ?? ann.authorId ?? 'U').slice(0, 2).toUpperCase();
                          const isExpanded = store.expandedThreadIds.has(ann.annotationId ?? '');

                          return (
                            <div
                              key={ann.annotationId}
                              onClick={() => store.setHighlightedAnnotation(isHighlighted ? null : (ann.annotationId ?? null))}
                              className={`cursor-pointer rounded-xl border bg-[hsl(240,10%,96%)] p-3.5 transition-all hover:border-[hsl(244,30%,80%)]/30 ${
                                isHighlighted
                                  ? 'border-[hsl(240,30%,46%)] ring-1 ring-[hsl(240,30%,46%)]/20'
                                  : 'border-[hsl(244,30%,80%)]/20'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(246,72%,78%)]/30 text-[9px] font-bold text-[hsl(237,45%,30%)]">
                                    {authorInitials}
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-[hsl(237,45%,30%)]">
                                      {ann.authorName ?? ann.authorId ?? 'Unknown'}
                                    </h4>
                                    <span className="text-[9px] text-[hsl(244,10%,40%)]/60">
                                      {formatTime(ann.createdAt)}
                                    </span>
                                  </div>
                                </div>
                                {isOpen ? (
                                  <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[8px] font-black text-emerald-800">OPEN</span>
                                ) : (
                                  <span className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[8px] font-black text-zinc-500">RESOLVED</span>
                                )}
                              </div>

                              <p
                                className="mt-2.5 text-xs font-semibold leading-relaxed text-[hsl(237,45%,30%)]/80"
                                onClick={e => e.stopPropagation()}
                              >
                                {ann.commentBody?.body}
                              </p>

                              {/* Replies (if expanded) */}
                              {isExpanded && ann.replies.length > 0 && (
                                <div className="mt-3 space-y-2 border-t border-[hsl(244,30%,80%)]/20 pt-2">
                                  {ann.replies.map(reply => (
                                    <div key={reply.annotationId} className="flex gap-2">
                                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[hsl(246,72%,78%)]/20 text-[8px] font-bold text-[hsl(237,45%,30%)]">
                                        {(reply.authorName ?? reply.authorId ?? 'U').slice(0, 2).toUpperCase()}
                                      </div>
                                      <div>
                                        <span className="text-[9px] font-bold text-[hsl(237,45%,30%)]">
                                          {reply.authorName ?? reply.authorId ?? 'Unknown'}
                                        </span>
                                        <p className="text-[10px] text-[hsl(237,45%,30%)]/75">{reply.commentBody?.body}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Reply form */}
                              {replyingToId === ann.annotationId && (
                                <form
                                  onSubmit={e => handleSubmitReply(e, ann.annotationId ?? '')}
                                  onClick={e => e.stopPropagation()}
                                  className="mt-3 flex flex-col gap-1.5 border-t border-[hsl(244,30%,80%)]/20 pt-2"
                                >
                                  <textarea
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    placeholder="Write a reply…"
                                    rows={2}
                                    autoFocus
                                    className="w-full resize-none rounded-lg border border-[hsl(244,30%,80%)]/50 bg-white p-2 text-xs text-[hsl(237,45%,30%)] outline-none focus:border-[hsl(240,30%,46%)]"
                                  />
                                  <div className="flex gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setReplyingToId(null)}
                                      className="flex-1 rounded-lg border border-[hsl(244,30%,80%)]/40 py-1 text-[10px] font-bold text-[hsl(237,45%,30%)]"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="submit"
                                      disabled={store.isSaving}
                                      className="flex-1 rounded-lg bg-[hsl(240,30%,46%)] py-1 text-[10px] font-bold text-white disabled:opacity-60"
                                    >
                                      Send
                                    </button>
                                  </div>
                                </form>
                              )}

                              <div
                                className="mt-3 flex items-center justify-between border-t border-[hsl(244,30%,80%)]/20 pt-2"
                                onClick={e => e.stopPropagation()}
                              >
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => setReplyingToId(ann.annotationId ?? null)}
                                    className="cursor-pointer text-[10px] font-bold text-[hsl(240,30%,46%)] hover:underline"
                                  >
                                    Reply
                                  </button>
                                  {ann.replies.length > 0 && (
                                    <button
                                      onClick={() => store.toggleThreadExpanded(ann.annotationId ?? '')}
                                      className="cursor-pointer text-[10px] font-bold text-[hsl(244,10%,40%)] hover:text-[hsl(240,30%,46%)]"
                                    >
                                      {isExpanded ? 'Hide' : `${ann.replies.length} repl${ann.replies.length === 1 ? 'y' : 'ies'}`}
                                    </button>
                                  )}
                                  {isOpen ? (
                                    <button
                                      onClick={() => store.resolveAnnotation(ann.annotationId ?? '')}
                                      className="cursor-pointer text-[10px] font-bold text-[hsl(244,10%,40%)] hover:text-[hsl(240,30%,46%)]"
                                    >
                                      Resolve
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => store.reopenAnnotation(ann.annotationId ?? '')}
                                      className="cursor-pointer text-[10px] font-bold text-[hsl(244,10%,40%)] hover:text-[hsl(240,30%,46%)]"
                                    >
                                      Reopen
                                    </button>
                                  )}
                                </div>
                                <button
                                  onClick={() => store.deleteAnnotation(ann.annotationId ?? '')}
                                  className="text-[hsl(244,30%,80%)] transition-colors hover:text-[hsl(0,84.2%,60.2%)]"
                                  title="Delete"
                                >
                                  <IconTrash />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* ─ Action Log ────────────────────────────────────────────── */}
              <section className="flex max-h-[220px] flex-col overflow-hidden border-b border-[hsl(244,30%,80%)]/20 p-5">
                <div
                  className="mb-2 flex cursor-pointer select-none items-center justify-between"
                  onClick={() => toggleSection('actionLog')}
                >
                  <h3 className="text-xs font-black uppercase tracking-wider text-[hsl(237,45%,30%)]">Action Log</h3>
                  <span className={`text-[hsl(244,30%,80%)] transition-transform ${expandedSections.actionLog ? 'rotate-180' : ''}`}>
                    <IconChevronDown />
                  </span>
                </div>
                {expandedSections.actionLog && (
                  <div className="mt-2 flex-1 space-y-2 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                    {mockActionLog.map(log => (
                      <div key={log.id} className="flex gap-2 rounded-lg border border-[hsl(244,30%,80%)]/20 bg-[hsl(240,10%,96%)] p-2 text-[11px]">
                        <span className="text-xs">{log.icon}</span>
                        <div className="flex-1">
                          <p className="font-bold text-[hsl(237,45%,30%)]">{log.action}</p>
                          {log.details && <p className="text-[10px] text-[hsl(244,10%,40%)]/85">{log.details}</p>}
                        </div>
                        <span className="whitespace-nowrap text-[9px] text-[hsl(244,10%,40%)]/60">{log.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ─ Image Metadata ─────────────────────────────────────────── */}
              <section className="p-5">
                <div
                  className="mb-3 flex cursor-pointer select-none items-center justify-between"
                  onClick={() => toggleSection('imageInfo')}
                >
                  <h3 className="text-xs font-black uppercase tracking-wider text-[hsl(237,45%,30%)]">Image Metadata</h3>
                  <span className={`text-[hsl(244,30%,80%)] transition-transform ${expandedSections.imageInfo ? 'rotate-180' : ''}`}>
                    <IconChevronDown />
                  </span>
                </div>
                {expandedSections.imageInfo && (
                  <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-3 text-xs">
                    {[
                      {
                        label: 'FILE NAME',
                        value: store.assetDetail?.asset?.name ?? store.imageData?.fileName ?? '—',
                      },
                      {
                        label: 'SIZE',
                        value: formatBytes(store.assetDetail?.latestVersion?.fileSize),
                      },
                      {
                        label: 'DIMENSIONS',
                        value: store.imageData?.dimensions?.width && store.imageData?.dimensions?.height
                          ? `${store.imageData.dimensions.width} × ${store.imageData.dimensions.height} px`
                          : '—',
                      },
                      {
                        label: 'UPLOADED',
                        value: store.assetDetail?.latestVersion?.createdAt
                          ? new Date(store.assetDetail.latestVersion.createdAt).toLocaleDateString()
                          : '—',
                      },
                      {
                        label: 'UPLOADER',
                        value: (store.assetDetail?.latestVersion as Record<string, unknown>)?.createdBy as string ?? '—',
                      },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-[hsl(244,10%,40%)]/70">{label}</span>
                        <span className="font-black text-[hsl(237,45%,30%)]">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

            </div>
          </aside>
        </div>
      </div>

      {/* A/B Compare Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-8 backdrop-blur-md">
          <div className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 p-4 text-white">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">Visual A/B Comparison</h3>
                <p className="text-xs text-zinc-400">Drag the slider to compare versions side by side</p>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="cursor-pointer rounded-xl bg-zinc-800 px-3.5 py-1.5 text-xs font-bold text-zinc-400 transition-all hover:bg-zinc-700 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-zinc-950 select-none">
              {/* Right layer — current version */}
              <img
                src={store.imageData?.previewUrl ?? ''}
                alt="Version A"
                className="pointer-events-none absolute inset-0 h-full w-full object-contain"
                draggable={false}
              />
              <div className="absolute right-4 top-4 z-10 rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-1 text-[10px] font-black text-[hsl(246,72%,78%)]">
                v{store.currentVersionNumber} (CURRENT)
              </div>

              {/* Left layer — previous version (clipped by slider) */}
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${compareSliderPos}%` }}>
                <img
                  src={
                    sortedVersions[currentVersionIdx - 1]
                      ? store.imageData?.previewUrl ?? ''
                      : store.imageData?.previewUrl ?? ''
                  }
                  alt="Version B"
                  className="pointer-events-none h-full object-contain"
                  style={{ width: `${(100 / compareSliderPos) * 100}%`, maxWidth: 'none' }}
                  draggable={false}
                />
                <div className="absolute left-4 top-4 z-10 rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-1 text-[10px] font-black text-amber-400">
                  v{sortedVersions[currentVersionIdx - 1]?.versionNumber ?? store.currentVersionNumber} (PREV)
                </div>
              </div>

              {/* Slider divider */}
              <div
                className="absolute bottom-0 top-0 z-20 flex w-0.5 cursor-ew-resize items-center justify-center bg-white"
                style={{ left: `${compareSliderPos}%` }}
              >
                <div className="-translate-x-1/2 flex h-8 w-8 cursor-ew-resize items-center justify-center rounded-full border border-zinc-200 bg-white text-xs font-bold text-slate-800 shadow-2xl">
                  ↔
                </div>
              </div>

              <input
                type="range" min="0" max="100"
                value={compareSliderPos}
                onChange={e => setCompareSliderPos(Number(e.target.value))}
                className="absolute inset-0 z-30 h-full w-full cursor-ew-resize opacity-0"
              />
            </div>

            <div className="border-t border-zinc-800 bg-zinc-950 p-3 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Drag the slider line left or right to compare details
            </div>
          </div>
        </div>
      )}

    </CommonLayout>
  );
});

export default ImageReviewPage;
