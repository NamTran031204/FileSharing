import { useEffect, useRef, useState } from 'react';
import { autorun } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useSearchParams } from 'react-router-dom';
import { Stage, Layer, Rect, Circle } from 'react-konva';
import { ReviewCoreStore } from '../store/review/ReviewCoreStore';
import type { AnnotationCore } from '../store/review/ReviewCoreStore';
import { MediaType, ProcessingStatus, UserGrantedRole } from '../api/api/index.defs';
import type { MediaAdapter } from '../components/mediaReview/bridge/MediaAdapter';
import MediaReviewLayout from '../components/mediaReview/MediaReviewLayout';
import HlsVideoPlayer from '../components/mediaReview/HlsVideoPlayer';
import type { HlsVideoPlayerHandle } from '../components/mediaReview/HlsVideoPlayer';
import type { LoopRegion } from '../components/mediaReview/VideoAnnotationTimeline';
import type { VideoAnnotation } from '../components/mediaReview/videoAnnotationTypes';
import { FloatingMarkupToolbar } from '../components/mediaReview/FloatingMarkupToolbar';
import { VideoBottomCapsuleControls } from '../components/videoReview/VideoBottomCapsuleControls';
import { StreamHealthPanel } from '../components/videoReview/StreamHealthPanel';
import { CommentPopupOverlay } from '../components/imageReview/CommentPopupOverlay';
import type { StrokeColor } from '../components/imageReview/constants';
import { useStore } from '../store';
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

const VideoReviewPage = observer(() => {
  const { sessionStore } = useStore();
  const [searchParams] = useSearchParams();
  const assetId = searchParams.get('assetId') ?? '';
  const versionParam = searchParams.get('version');

  const coreStoreRef = useRef(new ReviewCoreStore(MediaType.VIDEO));
  const playerRef = useRef<HlsVideoPlayerHandle>(null);

  const [currentMs, setCurrentMs] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [durationMs, setDurationMs] = useState(0);
  const [loopRegion, setLoopRegion] = useState<LoopRegion | null>(null);

  const [videoAnnotations, setVideoAnnotations] = useState<VideoAnnotation[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState<StrokeColor>('#f43f5e');

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
    if (loopRegion && ms >= loopRegion.outMs) {
      playerRef.current?.seek(loopRegion.inMs);
    }
  };
  const handlePlayerDurationChange = (ms: number) => {
    setDurationMs(ms);
  };
  const handlePlayerPauseChange = (paused: boolean) => {
    setIsPaused(paused);
    if (!paused) setSelectedTool('pan');
  };

  // Loop/trim mặc định bao trọn video — kéo IN/OUT để thu hẹp vùng lặp (client-side, xem TODO §5-4).
  useEffect(() => {
    if (durationMs > 0 && loopRegion === null) {
      setLoopRegion({ inMs: 0, outMs: durationMs });
    }
  }, [durationMs, loopRegion]);

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

  const handleToolClick = (tool: 'select' | 'rect' | 'circle' | 'arrow' | 'pan') => {
    if (tool === 'select')      setSelectedTool('select');
    else if (tool === 'rect')   setSelectedTool('rect');
    else if (tool === 'circle') setSelectedTool('circle');
    // useKonvaCanvas không có tool 'arrow' riêng — map như Image (ImageReviewPage.tsx) để hành vi đồng nhất.
    else if (tool === 'arrow')  setSelectedTool('rotate');
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

  const store = coreStoreRef.current;

  const displayTool: 'select' | 'rect' | 'circle' | 'arrow' | 'pan' =
    selectedTool === 'pan'    ? 'pan'
    : selectedTool === 'select' ? 'select'
    : selectedTool === 'rect'   ? 'rect'
    : selectedTool === 'circle' ? 'circle'
    : 'arrow';

  const stageInteractive = isPaused && (selectedTool === 'rect' || selectedTool === 'circle' || selectedTool === 'select');

  const visibleIds = new Set(
    videoAnnotations
      .filter(a => currentMs >= a.startMs && currentMs <= a.endMs)
      .map(a => a.id),
  );
  const renderedShapes = store.showAnnotations ? drawnShapes.filter(s => visibleIds.has(s.id)) : [];

  const previewShape = isDrawing && startPoint && currentPoint
    ? { startPoint, currentPoint, tool: selectedTool }
    : null;

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

  const isReady = store.currentVersionMetadata?.processingStatus === ProcessingStatus.READY;
  const viewingAsAdmin = sessionStore.appSession.isGrantedRole(UserGrantedRole.ROLE_ADMIN);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <MediaReviewLayout
        reviewStore={store}
        mediaAdapter={adapterRef.current}
        assetId={assetId}
        versionParam={versionParam}
        // TODO(api/design): Compare cho Video Review chưa có tính năng thật (nút hiện disabled, quyết định B.3-2).
        // Cần 1 vòng thiết kế UI riêng + xác nhận API so sánh 2 version video (side-by-side hoặc A/B) trước khi triển khai.
        topBarRight={
          <span className="flex items-center gap-2">
            <span>Viewing as {viewingAsAdmin ? 'Admin' : 'Customer'}</span>
            <span className="rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-[9px] font-black text-[var(--color-foreground)]">HLS</span>
          </span>
        }
      >
        {/* Outer container — measured by HlsVideoPlayer for letterbox-free content sizing */}
        <div className="relative flex flex-1 overflow-hidden bg-[var(--color-canvas)]">
          <HlsVideoPlayer
            ref={playerRef}
            assetId={store.assetId || assetId}
            versionNumber={store.currentVersionNumber}
            processingStatus={store.currentVersionMetadata?.processingStatus}
            contentRef={containerRef}
            onTimeUpdate={handlePlayerTimeUpdate}
            onDurationChange={handlePlayerDurationChange}
            onPauseChange={handlePlayerPauseChange}
          >
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
                          stroke={activeColor} strokeWidth={2}
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
                          stroke={activeColor} strokeWidth={2}
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
          </HlsVideoPlayer>

          {/* Markup toolbar — chỉ hiện khi video đang pause (giữ nguyên hành vi cũ) */}
          {isPaused && (
            <FloatingMarkupToolbar
              activeTool={displayTool}
              activeColor={activeColor}
              onToolClick={handleToolClick}
              onColorChange={setActiveColor}
            />
          )}

          {isReady && (
            <VideoBottomCapsuleControls
              playerRef={playerRef}
              isPaused={isPaused}
              currentMs={currentMs}
              durationMs={durationMs}
              annotations={videoAnnotations}
              selectedAnnotationId={selectedShapeId}
              onMarkerClick={handleMarkerClick}
              onSeek={handleSeek}
              showAnnotations={store.showAnnotations}
              onToggleAnnotations={() => store.toggleAnnotationVisibility()}
              loopRegion={loopRegion}
              onLoopRegionChange={setLoopRegion}
            />
          )}

          {/* TODO(role-gating): đang hiển thị Stream Health cho MỌI user để dựng UI trước (quyết định B.3-3).
              Role có sẵn: UserGrantedRole = ROLE_USER | ROLE_ADMIN | ROLE_SA (api/api/index.defs.ts:3010),
              check bằng sessionStore.isGrantedRole(UserGrantedRole.ROLE_ADMIN).
              ReviewerRole (REVIEWER | APPROVER) là khái niệm khác, không dùng cho gating này.
              Cần chốt với BA: "Admin" trong mockup = ROLE_ADMIN hệ thống hay vai trò riêng của review session? */}
          {isReady && <StreamHealthPanel playerRef={playerRef} />}
        </div>

        {/* Comment popup — appears after drawing a shape */}
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
    </div>
  );
});

export default VideoReviewPage;
