import { useCallback, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import useImage from 'use-image';
import { useSearchParams } from 'react-router-dom';
import CommonLayout from '../layout/CommonLayout';
import useKonvaCanvas from '../hooks/useKonvaCanvas';
import type { MarkupMode, ShapeTool } from '../hooks/useKonvaCanvas';
import { useStore } from '../store';
import { DEFAULT_STROKE_SIZE } from '../components/imageReview/constants';
import type { StrokeColor } from '../components/imageReview/constants';
import { ImagePlayer } from '../components/imageReview/ImagePlayer';
import { CommentPopupOverlay } from '../components/imageReview/CommentPopupOverlay';
import { ImageMediaAdapter } from '../components/imageReview/ImageMediaAdapter';
import MediaReviewLayout from '../components/mediaReview/MediaReviewLayout';

const ImageReviewPage = observer(() => {
  const { imageReviewStore: store } = useStore();
  const [searchParams] = useSearchParams();
  const assetId = searchParams.get('assetId') ?? '';
  const versionParam = searchParams.get('version');

  const [bgImage] = useImage(store.imageData?.previewUrl ?? '');

  const {
    containerRef, containerWidth, containerHeight,
    stageRef, transformerRef, shapeRefs,
    stageScale, stagePosition, setStageScale, setStagePosition,
    selectedTool, setSelectedTool,
    drawnShapes, setDrawnShapes, setSelectedShapeId,
    isDrawing, startPoint, currentPoint,
    handlers: { handleStageMouseDown, handleStageMouseMove, handleStageWheel, handleStageDragEnd, handleZoomIn, handleZoomOut, handleDragEnd, handleTransformEnd },
    helpers: { getCircleProps, getRectProps },
    zoomPercent,
  } = useKonvaCanvas({ worldWidth: bgImage?.width, worldHeight: bgImage?.height });

  const [activeMode, setActiveMode] = useState<MarkupMode>('select');
  const [activeShape, setActiveShape] = useState<ShapeTool>('rectangle');
  const [activeColor, setActiveColor] = useState<StrokeColor>('#f43f5e');
  const [strokeSize, setStrokeSize] = useState(DEFAULT_STROKE_SIZE);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareSliderPos, setCompareSliderPos] = useState(50);

  const [commentPopup, setCommentPopup] = useState<{ x: number; y: number } | null>(null);
  const [commentText, setCommentText] = useState('');
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const pendingShapeIdRef = useRef<string | null>(null);
  const viewportDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!assetId) return;
    store.player.fetchImageData(assetId);
    return () => store.player.reset();
  }, [assetId, store.player]);

  useEffect(() => {
    if (!bgImage || !store.imageData?.dimensions?.width || !store.imageData?.dimensions?.height) return;
    store.setScaleFactors(
      bgImage.width / store.imageData.dimensions.width,
      bgImage.height / store.imageData.dimensions.height,
    );
  }, [bgImage, store.imageData, store]);

  const prevIsDrawing = useRef(false);
  useEffect(() => {
    if (prevIsDrawing.current && !isDrawing && (selectedTool === 'rect' || selectedTool === 'circle')) {
      pendingShapeIdRef.current = drawnShapes[drawnShapes.length - 1]?.id ?? null;
      const stage = stageRef.current;
      const pos = stage?.getPointerPosition();
      if (pos) {
        const rect = stage?.container().getBoundingClientRect();
        setCommentPopup({ x: (rect?.left ?? 0) + pos.x, y: (rect?.top ?? 0) + pos.y });
        setCommentText('');
        setTimeout(() => commentInputRef.current?.focus(), 50);
      }
    }
    prevIsDrawing.current = isDrawing;
  }, [isDrawing, selectedTool, stageRef, drawnShapes]);

  useEffect(() => {
    if (activeMode === 'select') { setSelectedTool('select'); return; }
    if (activeMode === 'text')   { setSelectedTool('pan');    return; }
    if (activeMode === 'draw') {
      if (activeShape === 'circle')        setSelectedTool('circle');
      else if (activeShape === 'rectangle') setSelectedTool('rect');
      else setSelectedTool('rotate');
    }
  }, [activeMode, activeShape, setSelectedTool]);

  const adapterRef = useRef<ImageMediaAdapter | null>(null);
  if (!adapterRef.current) {
    adapterRef.current = new ImageMediaAdapter(
      store.player,
      stageRef,
      id => store.core.setHighlightedAnnotation(id),
    );
  }

  const handleZoomFit = useCallback(() => {
    if (!bgImage || containerWidth <= 0 || containerHeight <= 0) return;
    const fitScale = Math.min(containerWidth / bgImage.width, containerHeight / bgImage.height) * 0.9;
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
      if (pendingShapeId) setDrawnShapes(prev => prev.filter(s => s.id !== pendingShapeId));
      pendingShapeIdRef.current = null;
      setCommentPopup(null);
      setCommentText('');
    }
  };

  const handleToolClick = (tool: 'select' | 'rect' | 'circle' | 'arrow' | 'pan') => {
    if (tool === 'select')      setActiveMode('select');
    else if (tool === 'pan')    setActiveMode('text');
    else if (tool === 'rect')   { setActiveMode('draw'); setActiveShape('rectangle'); }
    else if (tool === 'circle') { setActiveMode('draw'); setActiveShape('circle'); }
    else if (tool === 'arrow')  { setActiveMode('draw'); setActiveShape('gesture'); }
    setSelectedShapeId(null);
  };

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

  const sortedVersions = [...store.versions].sort((a, b) => (a.versionNumber ?? 0) - (b.versionNumber ?? 0));
  const currentVersionIdx = sortedVersions.findIndex(v => v.versionNumber === store.currentVersionNumber);

  return (
    <CommonLayout>
      <MediaReviewLayout
        reviewStore={store.core}
        mediaAdapter={adapterRef.current}
        assetId={assetId}
        versionParam={versionParam}
        onVersionChange={() => { setDrawnShapes([]); setSelectedShapeId(null); }}
        markupTools={{
          activeTool,
          activeColor,
          strokeSize,
          onToolClick: (tool) => handleToolClick(tool),
          onColorChange: (c) => setActiveColor(c as StrokeColor),
          onStrokeSizeChange: setStrokeSize,
        }}
        onCompare={() => setShowCompareModal(true)}
        imageData={store.imageData}
      >
        <ImagePlayer
          bgImage={bgImage}
          isImageLoading={store.isImageLoading}
          isInitialLoading={store.isInitialLoading}
          allKonvaShapes={store.allKonvaShapes}
          showAnnotations={store.showAnnotations}
          highlightedAnnotationId={store.highlightedAnnotationId}
          activeTool={activeTool}
          activeColor={activeColor}
          viewportCursor={viewportCursor}
          viewportDivRef={viewportDivRef}
          canvas={{
            containerRef,
            containerWidth,
            containerHeight,
            stageRef,
            transformerRef,
            shapeRefs,
            stageScale,
            stagePosition,
            selectedTool,
            drawnShapes,
            isDrawing,
            startPoint,
            currentPoint,
            zoomPercent,
            handlers: { handleStageMouseDown, handleStageMouseMove, handleStageWheel, handleStageDragEnd, handleZoomIn, handleZoomOut, handleDragEnd, handleTransformEnd },
            helpers: { getCircleProps, getRectProps },
          }}
          onHighlightAnnotation={id => store.setHighlightedAnnotation(id)}
          onToolClick={handleToolClick}
          onColorChange={c => setActiveColor(c)}
          onZoomFit={handleZoomFit}
          onZoom100={handleZoom100}
          onToggleAnnotations={() => store.toggleAnnotationVisibility()}
          setSelectedShapeId={setSelectedShapeId}
        />

        {commentPopup && (
          <CommentPopupOverlay
            position={commentPopup}
            commentText={commentText}
            isSaving={store.isSaving}
            annotationError={store.annotationError}
            textareaRef={commentInputRef}
            onTextChange={setCommentText}
            onSubmit={handleSubmitComment}
            onClose={handleCloseCommentPopup}
          />
        )}
      </MediaReviewLayout>

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
              <img
                src={store.imageData?.previewUrl ?? ''}
                alt="Version A"
                className="pointer-events-none absolute inset-0 h-full w-full object-contain"
                draggable={false}
              />
              <div className="absolute right-4 top-4 z-10 rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-1 text-[10px] font-black text-[hsl(246,72%,78%)]">
                v{store.currentVersionNumber} (CURRENT)
              </div>
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${compareSliderPos}%` }}>
                <img
                  src={sortedVersions[currentVersionIdx - 1] ? store.imageData?.previewUrl ?? '' : store.imageData?.previewUrl ?? ''}
                  alt="Version B"
                  className="pointer-events-none h-full object-contain"
                  style={{ width: `${(100 / compareSliderPos) * 100}%`, maxWidth: 'none' }}
                  draggable={false}
                />
                <div className="absolute left-4 top-4 z-10 rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-1 text-[10px] font-black text-amber-400">
                  v{sortedVersions[currentVersionIdx - 1]?.versionNumber ?? store.currentVersionNumber} (PREV)
                </div>
              </div>
              <div
                className="absolute bottom-0 top-0 z-20 flex w-0.5 cursor-ew-resize items-center justify-center bg-white"
                style={{ left: `${compareSliderPos}%` }}
              >
                <div className="-translate-x-1/2 flex h-8 w-8 cursor-ew-resize items-center justify-center rounded-full border border-zinc-200 bg-white text-xs font-bold text-slate-800 shadow-2xl">↔</div>
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
