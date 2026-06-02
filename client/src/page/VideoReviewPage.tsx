import { useEffect, useRef, useState } from 'react';
import { autorun } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useSearchParams } from 'react-router-dom';
import { Stage, Layer, Rect, Circle } from 'react-konva';
import CommonLayout from '../layout/CommonLayout';
import { ReviewCoreStore } from '../store/review/ReviewCoreStore';
import type { AnnotationCore } from '../store/review/ReviewCoreStore';
import { MediaType } from '../api/api/index.defs';
import type { MediaAdapter } from '../components/mediaReview/bridge/MediaAdapter';
import MediaReviewLayout from '../components/mediaReview/MediaReviewLayout';
import HlsVideoPlayer from '../components/mediaReview/HlsVideoPlayer';
import type { HlsVideoPlayerHandle } from '../components/mediaReview/HlsVideoPlayer';
import VideoAnnotationTimeline from '../components/mediaReview/VideoAnnotationTimeline';
import type { VideoAnnotation } from '../components/mediaReview/videoAnnotationTypes';
import useKonvaCanvas from '../hooks/useKonvaCanvas';
import type { Shape } from '../hooks/useKonvaCanvas';
import { buildShapeInfoList } from '../utils/coordinateTransform';
import type { KonvaShapeData } from '../utils/coordinateTransform';

const DEFAULT_ANNOTATION_DURATION_MS = 3000;
const SERVER_SHAPE_STROKE = 'rgba(255,255,255,0.85)';
const SERVER_SHAPE_STROKE_WIDTH = 2;

function storeAnnToVideoAnnotation(ann: AnnotationCore): VideoAnnotation | null {
  if (!ann.region?.length || !ann.annotationId) return null;
  const si = ann.region[0];
  const isCircle = (si.shape as string) === 'CIRCLE';
  const type = isCircle ? 'circle' as const : 'rect' as const;
  const startMs = ann.timeCode?.startMs != null ? Number(ann.timeCode.startMs) : 0;
  const endMs = ann.timeCode?.endMs != null
    ? Number(ann.timeCode.endMs)
    : startMs + DEFAULT_ANNOTATION_DURATION_MS;
  return {
    id: ann.annotationId,
    type,
    x: si.x ?? 0,
    y: si.y ?? 0,
    width: type === 'rect' ? si.width : undefined,
    height: type === 'rect' ? si.height : undefined,
    radius: type === 'circle' ? si.radius : undefined,
    rotation: 0,
    stroke: SERVER_SHAPE_STROKE,
    strokeWidth: SERVER_SHAPE_STROKE_WIDTH,
    startMs,
    endMs,
  };
}

function storeAnnToShape(ann: AnnotationCore): Shape | null {
  if (!ann.region?.length || !ann.annotationId) return null;
  const si = ann.region[0];
  const id = ann.annotationId;
  if ((si.shape as string) === 'CIRCLE') {
    return {
      id,
      type: 'circle',
      x: si.x ?? 0,
      y: si.y ?? 0,
      radius: si.radius ?? 50,
      rotation: 0,
      stroke: SERVER_SHAPE_STROKE,
      strokeWidth: SERVER_SHAPE_STROKE_WIDTH,
    };
  }
  return {
    id,
    type: 'rect',
    x: si.x ?? 0,
    y: si.y ?? 0,
    width: si.width ?? 100,
    height: si.height ?? 100,
    rotation: 0,
    stroke: SERVER_SHAPE_STROKE,
    strokeWidth: SERVER_SHAPE_STROKE_WIDTH,
  };
}

// toolbar
const IconSelect = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4l7 18 3-7 7-3L4 4z" strokeLinejoin="round" />
  </svg>
);
const IconRect = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);
const IconCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
  </svg>
);
const IconPan = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M12 12v.01" strokeLinecap="round" />
  </svg>
);

const VideoReviewPage = observer(() => {
  const [searchParams] = useSearchParams();
  const assetId = searchParams.get('assetId') ?? '';
  const versionParam = searchParams.get('version');

  const coreStoreRef = useRef(new ReviewCoreStore(MediaType.VIDEO));
  const playerRef = useRef<HlsVideoPlayerHandle>(null);

  const [currentMs, setCurrentMs] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [durationMs, setDurationMs] = useState(0);

  const [videoAnnotations, setVideoAnnotations] = useState<VideoAnnotation[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  const [commentPopup, setCommentPopup] = useState<{ x: number; y: number } | null>(null);
  const [commentText, setCommentText] = useState('');
  const pendingShapeIdRef = useRef<string | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const videoAnnotationsRef = useRef<VideoAnnotation[]>([]);

  const {
    containerRef,
    containerWidth,
    containerHeight,
    stageRef,
    drawnShapes,
    setDrawnShapes,
    isDrawing,
    startPoint,
    currentPoint,
    stageScale,
    stagePosition,
    selectedTool,
    setSelectedTool,
    handlers: { handleStageMouseDown, handleStageMouseMove, handleStageWheel },
    helpers: { getCircleProps, getRectProps },
  } = useKonvaCanvas({ worldWidth: undefined, worldHeight: undefined });

  const handlePlayerTimeUpdate = (ms: number) => {
    setCurrentMs(ms);
  };
  const handlePlayerDurationChange = (ms: number) => {
    setDurationMs(ms);
  };
  const handlePlayerPauseChange = (paused: boolean) => {
    setIsPaused(paused);
    if (!paused) setSelectedTool('pan');
  };

  useEffect(() => {
    const store = coreStoreRef.current;
    const dispose = autorun(() => {
      const serverVideoAnns = store.annotations
        .filter(a => a.region?.length && a.annotationId)
        .map(storeAnnToVideoAnnotation)
        .filter((a): a is VideoAnnotation => a !== null);

      const serverShapes = store.annotations
        .filter(a => a.region?.length && a.annotationId)
        .map(storeAnnToShape)
        .filter((s): s is Shape => s !== null);

      videoAnnotationsRef.current = serverVideoAnns;

      const pendingId = pendingShapeIdRef.current;
      setVideoAnnotations(prev => {
        const pending = pendingId ? prev.filter(a => a.id === pendingId) : [];
        return [...serverVideoAnns, ...pending];
      });
      setDrawnShapes(prev => {
        const pending = pendingId ? prev.filter(s => s.id === pendingId) : [];
        return [...serverShapes, ...pending];
      });
    });
    return dispose;
  }, []);

  const prevIsDrawing = useRef(false);
  useEffect(() => {
    if (prevIsDrawing.current && !isDrawing && (selectedTool === 'rect' || selectedTool === 'circle')) {
      const newShape = drawnShapes[drawnShapes.length - 1];
      if (!newShape) return;

      const startMs = playerRef.current?.getCurrentMs() ?? currentMs;
      const endMs = startMs + DEFAULT_ANNOTATION_DURATION_MS;

      const ann: VideoAnnotation = {
        id: newShape.id,
        type: newShape.type,
        x: newShape.x,
        y: newShape.y,
        width: newShape.type === 'rect' ? (newShape as { width: number }).width : undefined,
        height: newShape.type === 'rect' ? (newShape as { height: number }).height : undefined,
        radius: newShape.type === 'circle' ? (newShape as { radius: number }).radius : undefined,
        rotation: newShape.rotation ?? 0,
        stroke: newShape.stroke,
        strokeWidth: newShape.strokeWidth,
        startMs,
        endMs,
      };
      setVideoAnnotations(prev => [...prev, ann]);

      pendingShapeIdRef.current = newShape.id;
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
  }, [isDrawing, selectedTool, drawnShapes, currentMs, stageRef]);

  const handleCloseCommentPopup = () => {
    const id = pendingShapeIdRef.current;
    if (id) {
      setDrawnShapes(prev => prev.filter(s => s.id !== id));
      setVideoAnnotations(prev => prev.filter(a => a.id !== id));
      pendingShapeIdRef.current = null;
    }
    setCommentPopup(null);
    setCommentText('');
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !assetId) return;

    const pendingId = pendingShapeIdRef.current;
    const pendingShape = pendingId ? drawnShapes.find(s => s.id === pendingId) : null;
    const pendingAnn = pendingId ? videoAnnotations.find(a => a.id === pendingId) : null;

    const shapeData: KonvaShapeData[] = pendingShape
      ? [{
          id: pendingShape.id,
          type: pendingShape.type,
          x: pendingShape.x,
          y: pendingShape.y,
          width: pendingShape.type === 'rect' ? (pendingShape as { width: number }).width : undefined,
          height: pendingShape.type === 'rect' ? (pendingShape as { height: number }).height : undefined,
          radius: pendingShape.type === 'circle' ? (pendingShape as { radius: number }).radius : undefined,
          stroke: pendingShape.stroke,
          strokeWidth: pendingShape.strokeWidth,
          rotation: pendingShape.rotation ?? 0,
        }]
      : [];

    const region = buildShapeInfoList(shapeData, { scaleX: 1, scaleY: 1 });
    const timeCode = pendingAnn ? { startMs: pendingAnn.startMs, endMs: pendingAnn.endMs } : undefined;

    const result = await coreStoreRef.current.createAnnotation(commentText.trim(), region, timeCode);
    if (result) {
      if (pendingId) setDrawnShapes(prev => prev.filter(s => s.id !== pendingId));
      pendingShapeIdRef.current = null;
      setCommentPopup(null);
      setCommentText('');
    }
  };

  const handleToolClick = (tool: 'select' | 'rect' | 'circle' | 'pan') => {
    if (tool === 'select')  setSelectedTool('select');
    else if (tool === 'rect')   setSelectedTool('rect');
    else if (tool === 'circle') setSelectedTool('circle');
    else setSelectedTool('pan');
    setSelectedShapeId(null);
  };

  const handleMarkerClick = (id: string) => {
    const ann = videoAnnotations.find(a => a.id === id);
    if (ann) playerRef.current?.seek(ann.startMs);
    setSelectedShapeId(id);
  };

  const handleSeek = (ms: number) => {
    playerRef.current?.seek(ms);
  };

  const stageInteractive = isPaused && (selectedTool === 'rect' || selectedTool === 'circle' || selectedTool === 'select');

  const visibleIds = new Set(
    videoAnnotations
      .filter(a => currentMs >= a.startMs && currentMs <= a.endMs)
      .map(a => a.id),
  );
  const renderedShapes = drawnShapes.filter(s => visibleIds.has(s.id));

  const previewShape = isDrawing && startPoint && currentPoint
    ? { startPoint, currentPoint, tool: selectedTool }
    : null;

  const store = coreStoreRef.current;

  const adapterRef = useRef<MediaAdapter>({
    mediaType: MediaType.VIDEO,
    focusAnnotation: (annotationId) => {
      const ann = store.annotations.find(a => a.annotationId === annotationId);
      const tc = ann?.timeCode;
      if (tc?.startMs != null) {
        playerRef.current?.seek(Number(tc.startMs));
        const matching = videoAnnotationsRef.current.find(a => a.id === annotationId);
        if (matching) setSelectedShapeId(matching.id);
      }
    },
    buildRegion: (_shapes) => [],
  });

  return (
    <CommonLayout>
      <MediaReviewLayout
        reviewStore={store}
        mediaAdapter={adapterRef.current}
        assetId={assetId}
        versionParam={versionParam}
      >
        {/* Outer container — measured by useKonvaCanvas for canvas sizing */}
        <div ref={containerRef} className="relative flex flex-1 overflow-hidden bg-zinc-950">
          <HlsVideoPlayer
            ref={playerRef}
            assetId={store.assetId || assetId}
            versionNumber={store.currentVersionNumber}
            processingStatus={store.currentVersionMetadata?.processingStatus}
            onTimeUpdate={handlePlayerTimeUpdate}
            onDurationChange={handlePlayerDurationChange}
            onPauseChange={handlePlayerPauseChange}
            timelineContent={
              <VideoAnnotationTimeline
                durationMs={durationMs}
                currentMs={currentMs}
                annotations={videoAnnotations}
                selectedId={selectedShapeId}
                onSeek={handleSeek}
                onMarkerClick={handleMarkerClick}
              />
            }
          />

          {containerWidth > 0 && containerHeight > 0 && (
            <div
              className="absolute inset-0"
              style={{ pointerEvents: stageInteractive ? 'auto' : 'none' }}
            >
              <Stage
                ref={stageRef}
                width={containerWidth}
                height={containerHeight}
                scaleX={stageScale}
                scaleY={stageScale}
                x={stagePosition.x}
                y={stagePosition.y}
                onMouseDown={handleStageMouseDown}
                onMouseMove={handleStageMouseMove}
                onWheel={handleStageWheel}
                style={{ cursor: selectedTool === 'pan' ? 'grab' : selectedTool === 'select' ? 'default' : 'crosshair' }}
              >
                <Layer>
                  {renderedShapes.map(s => {
                    const isSelected = s.id === selectedShapeId;
                    const strokeColor = isSelected ? 'var(--color-primary)' : s.stroke;
                    if (s.type === 'rect') {
                      const rs = s as Shape & { width: number; height: number };
                      return (
                        <Rect
                          key={s.id}
                          x={rs.x}
                          y={rs.y}
                          width={rs.width}
                          height={rs.height}
                          rotation={rs.rotation ?? 0}
                          stroke={strokeColor}
                          strokeWidth={rs.strokeWidth}
                          fill="transparent"
                          onClick={() => setSelectedShapeId(s.id)}
                        />
                      );
                    }
                    const cs = s as Shape & { radius: number };
                    return (
                      <Circle
                        key={s.id}
                        x={cs.x}
                        y={cs.y}
                        radius={cs.radius}
                        rotation={cs.rotation ?? 0}
                        stroke={strokeColor}
                        strokeWidth={cs.strokeWidth}
                        fill="transparent"
                        onClick={() => setSelectedShapeId(s.id)}
                      />
                    );
                  })}

                  {previewShape && previewShape.tool === 'rect' && (() => {
                    const { x, y, width, height } = getRectProps(previewShape.startPoint, previewShape.currentPoint);
                    return (
                      <Rect
                        x={x} y={y} width={width} height={height}
                        stroke="rgba(255,255,255,0.8)" strokeWidth={2}
                        fill="rgba(255,255,255,0.08)"
                        dash={[6, 3]}
                        listening={false}
                      />
                    );
                  })()}
                  {previewShape && previewShape.tool === 'circle' && (() => {
                    const { x, y, radius } = getCircleProps(previewShape.startPoint, previewShape.currentPoint);
                    return (
                      <Circle
                        x={x} y={y} radius={radius}
                        stroke="rgba(255,255,255,0.8)" strokeWidth={2}
                        fill="rgba(255,255,255,0.08)"
                        dash={[6, 3]}
                        listening={false}
                      />
                    );
                  })()}
                </Layer>
              </Stage>
            </div>
          )}

          {/* Drawing toolbar — only visible when video is paused */}
          {isPaused && (
            <div className="absolute left-3 top-3 z-30 flex flex-col gap-1 rounded-lg p-1"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {(
                [
                  { key: 'select', label: 'Select', Icon: IconSelect },
                  { key: 'rect',   label: 'Rectangle', Icon: IconRect },
                  { key: 'circle', label: 'Circle', Icon: IconCircle },
                  { key: 'pan',    label: 'Pan', Icon: IconPan },
                ] as const
              ).map(({ key, label, Icon }) => {
                const active = selectedTool === key;
                return (
                  <button
                    key={key}
                    type="button"
                    title={label}
                    onClick={() => handleToolClick(key)}
                    className="flex h-8 w-8 items-center justify-center rounded transition-colors"
                    style={{
                      color: active ? 'var(--color-primary)' : 'rgba(255,255,255,0.7)',
                      background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Icon />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Comment popup — appears after drawing a shape */}
        {commentPopup && (
          <div
            className="fixed z-50 w-64 rounded-xl p-3 shadow-xl"
            style={{
              left: commentPopup.x + 8,
              top: commentPopup.y + 8,
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            <form onSubmit={handleSubmitComment} className="flex flex-col gap-2">
              <textarea
                ref={commentInputRef}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSubmitComment(e as unknown as React.FormEvent); } }}
                placeholder="Add a comment…"
                rows={3}
                className="w-full resize-none rounded-lg p-2 text-sm outline-none"
                style={{
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-foreground)',
                }}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseCommentPopup}
                  className="rounded-lg px-3 py-1 text-xs"
                  style={{ background: 'transparent', color: 'var(--color-muted-foreground)', cursor: 'pointer', border: 'none' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="rounded-lg px-3 py-1 text-xs font-medium"
                  style={{
                    background: 'var(--color-primary)',
                    color: 'var(--color-primary-foreground)',
                    cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                    opacity: commentText.trim() ? 1 : 0.5,
                    border: 'none',
                  }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}
      </MediaReviewLayout>
    </CommonLayout>
  );
});

export default VideoReviewPage;
