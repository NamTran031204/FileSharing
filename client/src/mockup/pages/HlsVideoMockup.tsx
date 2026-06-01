import { InputNumber, Segmented, Typography } from 'antd';
import { MarkerIcon } from '../../assets/icon/MarkerIcon';
import Hls from 'hls.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Layer, Rect, Stage, Transformer } from 'react-konva';
import type Konva from 'konva';

import CommonLayout from '../../layout/CommonLayout';
import useKonvaCanvas from '../../hooks/useKonvaCanvas';
import type { Shape } from '../../hooks/useKonvaCanvas';

import AnnotationTimeline from './hlsAnnotate/AnnotationTimeline';
import { buildSeedAnnotations } from './hlsAnnotate/mockAnnotations';
import type { AnnotateMode, VideoAnnotation } from './hlsAnnotate/types';
import { useVideoAnnotations } from './hlsAnnotate/useVideoAnnotations';

const { Title } = Typography;

const FIXED_MASTER_PLAYLIST_URL = '/hls-local/master.m3u8';
const COLOR_PRIMARY = 'hsl(var(--primary))';
const COLOR_ACCENT = 'hsl(var(--accent))';
const DEFAULT_STROKE_SIZE = 4;
const DEFAULT_DURATION_MS = 3000;

const formatMs = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

const annotationToShape = (a: VideoAnnotation): Shape => {
  if (a.type === 'circle') {
    return {
      id: a.id,
      type: 'circle',
      x: a.x,
      y: a.y,
      radius: a.radius ?? 0,
      rotation: a.rotation,
      stroke: a.stroke,
      strokeWidth: a.strokeWidth,
    };
  }
  return {
    id: a.id,
    type: 'rect',
    x: a.x,
    y: a.y,
    width: a.width ?? 0,
    height: a.height ?? 0,
    rotation: a.rotation,
    stroke: a.stroke,
    strokeWidth: a.strokeWidth,
  };
};

const sortedIdKey = (items: { id: string }[]) =>
  items
    .map((i) => i.id)
    .sort()
    .join('|');

const HlsVideoMockup = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [videoSize, setVideoSize] = useState<{ width: number; height: number } | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);

  const [mode, setMode] = useState<AnnotateMode>('view');
  const [annotations, setAnnotations] = useState<VideoAnnotation[]>([]);
  const seededRef = useRef(false);

  useEffect(() => {
    setActiveUrl(FIXED_MASTER_PLAYLIST_URL);
  }, []);

  const konva = useKonvaCanvas({
    worldWidth: videoSize?.width,
    worldHeight: videoSize?.height,
    fitPadding: 1,
  });

  const {
    containerRef,
    containerWidth,
    containerHeight,
    stageRef,
    transformerRef,
    shapeRefs,
    stageScale,
    stagePosition,
    selectedTool,
    setSelectedTool,
    drawnShapes,
    setDrawnShapes,
    selectedShapeId,
    setSelectedShapeId,
    isDrawing,
    startPoint,
    currentPoint,
    handlers,
    helpers,
  } = konva;

  const { visibleIds, currentMs } = useVideoAnnotations({ videoRef, annotations });
  const currentMsRef = useRef(currentMs);
  useEffect(() => {
    currentMsRef.current = currentMs;
  }, [currentMs]);

  // Mode → tool mapping
  useEffect(() => {
    if (mode === 'view') setSelectedTool('pan');
    else if (mode === 'select') setSelectedTool('select');
    else if (mode === 'draw-rect') setSelectedTool('rect');
    else if (mode === 'draw-circle') setSelectedTool('circle');
  }, [mode, setSelectedTool]);

  // Pause when entering annotate mode
  useEffect(() => {
    if (mode !== 'view' && videoRef.current) {
      videoRef.current.pause();
    }
  }, [mode]);

  // Play/pause listener
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setIsPaused(false);
    const onPause = () => setIsPaused(true);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, [activeUrl]);

  // HLS init + loadedmetadata
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !activeUrl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const handleLoadedMetadata = () => {
      setVideoSize({
        width: videoElement.videoWidth,
        height: videoElement.videoHeight,
      });
      setDurationMs((videoElement.duration || 0) * 1000);
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);

    const resetVideoSource = () => {
      videoElement.pause();
      videoElement.removeAttribute('src');
      videoElement.load();
    };

    resetVideoSource();

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hlsRef.current = hls;
      hls.loadSource(activeUrl);
      hls.attachMedia(videoElement);

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
      });

      return () => {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        hls.destroy();
        hlsRef.current = null;
      };
    }

    if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      videoElement.src = activeUrl;
      return () => {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        resetVideoSource();
      };
    }

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [activeUrl]);

  // Seed annotations once videoSize known
  useEffect(() => {
    if (!videoSize || seededRef.current) return;
    seededRef.current = true;
    setAnnotations(buildSeedAnnotations(videoSize.width, videoSize.height));
  }, [videoSize]);

  // Sync annotations ↔ drawnShapes (id-set level)
  useEffect(() => {
    const annKey = sortedIdKey(annotations);
    const shapeKey = sortedIdKey(drawnShapes);
    if (annKey === shapeKey) return;

    const annIdSet = new Set(annotations.map((a) => a.id));
    const drawnIdSet = new Set(drawnShapes.map((s) => s.id));
    const newInDrawn = drawnShapes.filter((s) => !annIdSet.has(s.id));
    const newInAnn = annotations.filter((a) => !drawnIdSet.has(a.id));

    if (newInDrawn.length > 0 && newInAnn.length === 0) {
      // User drew new shape via Konva — promote to annotations
      const t = currentMsRef.current;
      const additions: VideoAnnotation[] = newInDrawn.map((s) =>
        s.type === 'circle'
          ? {
              id: s.id,
              type: 'circle',
              x: s.x,
              y: s.y,
              radius: s.radius,
              rotation: s.rotation ?? 0,
              stroke: s.stroke,
              strokeWidth: s.strokeWidth,
              startMs: t,
              endMs: t + DEFAULT_DURATION_MS,
              createdAt: Date.now(),
            }
          : {
              id: s.id,
              type: 'rect',
              x: s.x,
              y: s.y,
              width: s.width,
              height: s.height,
              rotation: s.rotation ?? 0,
              stroke: s.stroke,
              strokeWidth: s.strokeWidth,
              startMs: t,
              endMs: t + DEFAULT_DURATION_MS,
              createdAt: Date.now(),
            },
      );
      setAnnotations((prev) => [...prev, ...additions]);
    } else {
      // annotations is canonical — push to drawnShapes (covers seed + delete)
      setDrawnShapes(annotations.map(annotationToShape));
    }
  }, [annotations, drawnShapes, setDrawnShapes]);

  // drawnShapes geometry → annotations (drag/transform)
  useEffect(() => {
    if (drawnShapes.length === 0) return;
    setAnnotations((prev) => {
      let changed = false;
      const next = prev.map((a) => {
        const s = drawnShapes.find((x) => x.id === a.id);
        if (!s) return a;
        if (s.type === 'circle' && a.type === 'circle') {
          if (
            s.x !== a.x ||
            s.y !== a.y ||
            s.radius !== a.radius ||
            (s.rotation ?? 0) !== a.rotation
          ) {
            changed = true;
            return { ...a, x: s.x, y: s.y, radius: s.radius, rotation: s.rotation ?? 0 };
          }
        } else if (s.type === 'rect' && a.type === 'rect') {
          if (
            s.x !== a.x ||
            s.y !== a.y ||
            s.width !== a.width ||
            s.height !== a.height ||
            (s.rotation ?? 0) !== a.rotation
          ) {
            changed = true;
            return {
              ...a,
              x: s.x,
              y: s.y,
              width: s.width,
              height: s.height,
              rotation: s.rotation ?? 0,
            };
          }
        }
        return a;
      });
      return changed ? next : prev;
    });
  }, [drawnShapes]);

  // Auto-hide controls: always visible when paused or in draw/select mode
  useEffect(() => {
    if (isPaused || mode !== 'view') {
      setControlsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isPaused, mode]);

  const handleMouseActivity = () => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (!isPaused && mode === 'view') {
      hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
    }
  };

  const handleMouseLeave = () => {
    if (!isPaused && mode === 'view') {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setControlsVisible(false), 800);
    }
  };

  // Shapes to render
  const renderedShapes = useMemo(() => {
    if (mode !== 'view') return drawnShapes;
    return drawnShapes.filter((s) => visibleIds.has(s.id));
  }, [mode, drawnShapes, visibleIds]);

  const handlePlayPause = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      setMode('view');
      void v.play().catch(() => {});
    } else {
      v.pause();
    }
  };

  const handleSeek = (ms: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, ms) / 1000;
  };

  const handleMarkerClick = (id: string) => {
    const ann = annotations.find((a) => a.id === id);
    const v = videoRef.current;
    if (!ann || !v) return;
    v.currentTime = ann.startMs / 1000;
    v.pause();
    setMode('select');
    setSelectedShapeId(id);
  };

  const updateSelectedRange = (
    patch: Partial<Pick<VideoAnnotation, 'startMs' | 'endMs'>>,
  ) => {
    if (!selectedShapeId) return;
    setAnnotations((prev) =>
      prev.map((a) => (a.id === selectedShapeId ? { ...a, ...patch } : a)),
    );
  };

  const selectedAnnotation = annotations.find((a) => a.id === selectedShapeId) ?? null;

  const stageInteractive = mode !== 'view';

  return (
    <CommonLayout>
      <div
        className="flex-1 overflow-y-auto p-6"
        style={{ background: 'var(--color-background)' }}
      >
        <div className="mx-auto w-full max-w-[1100px]">
          {/* Page header */}
          <div className="mb-6">
            <Title level={3} className="mb-1!" style={{ color: 'var(--color-foreground)' }}>
              Video Review Tool
            </Title>
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              Draw shapes on the video to create precise time-stamped markers.
            </p>
          </div>

          {/* Two-column responsive layout */}
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* ── Player column ── */}
            <div className="min-w-0 flex-1">
              <div
                ref={containerRef}
                className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black"
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 20px 50px -12px rgba(0,0,0,0.5)',
                }}
                onMouseMove={handleMouseActivity}
                onMouseEnter={handleMouseActivity}
                onMouseLeave={handleMouseLeave}
              >
                <video
                  ref={videoRef}
                  playsInline
                  className="absolute inset-0 h-full w-full"
                  style={{ objectFit: 'contain' }}
                />

                {videoSize && containerWidth > 0 && containerHeight > 0 && (
                  <Stage
                    ref={stageRef}
                    width={containerWidth}
                    height={containerHeight}
                    scale={{ x: stageScale, y: stageScale }}
                    position={stagePosition}
                    onMouseDown={handlers.handleStageMouseDown}
                    onMouseMove={handlers.handleStageMouseMove}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 5,
                      pointerEvents: stageInteractive ? 'auto' : 'none',
                    }}
                  >
                    <Layer>
                      {renderedShapes.map((shape) => {
                        const isDraggable = selectedTool === 'select';
                        if (shape.type === 'circle') {
                          return (
                            <Circle
                              key={shape.id}
                              x={shape.x}
                              y={shape.y}
                              radius={shape.radius}
                              rotation={shape.rotation ?? 0}
                              stroke={shape.stroke}
                              strokeWidth={shape.strokeWidth}
                              draggable={isDraggable}
                              onClick={() =>
                                selectedTool === 'select' && setSelectedShapeId(shape.id)
                              }
                              onTap={() =>
                                selectedTool === 'select' && setSelectedShapeId(shape.id)
                              }
                              ref={(node) => {
                                shapeRefs.current[shape.id] = node;
                              }}
                              onDragEnd={(e) => handlers.handleDragEnd(shape.id, e)}
                              onTransformEnd={(e) =>
                                handlers.handleTransformEnd(shape.id, e.target as Konva.Shape)
                              }
                            />
                          );
                        }
                        return (
                          <Rect
                            key={shape.id}
                            x={shape.x}
                            y={shape.y}
                            width={shape.width}
                            height={shape.height}
                            rotation={shape.rotation ?? 0}
                            stroke={shape.stroke}
                            strokeWidth={shape.strokeWidth}
                            draggable={isDraggable}
                            onClick={() =>
                              selectedTool === 'select' && setSelectedShapeId(shape.id)
                            }
                            onTap={() =>
                              selectedTool === 'select' && setSelectedShapeId(shape.id)
                            }
                            ref={(node) => {
                              shapeRefs.current[shape.id] = node;
                            }}
                            onDragEnd={(e) => handlers.handleDragEnd(shape.id, e)}
                            onTransformEnd={(e) =>
                              handlers.handleTransformEnd(shape.id, e.target as Konva.Shape)
                            }
                          />
                        );
                      })}

                      <Transformer
                        ref={transformerRef}
                        rotateEnabled={false}
                        enabledAnchors={[]}
                        ignoreStroke
                      />

                      {isDrawing && startPoint && currentPoint && selectedTool === 'circle' && (
                        <Circle
                          {...helpers.getCircleProps(startPoint, currentPoint)}
                          stroke={COLOR_PRIMARY}
                          strokeWidth={DEFAULT_STROKE_SIZE}
                          dash={[5, 5]}
                          opacity={0.7}
                        />
                      )}
                      {isDrawing && startPoint && currentPoint && selectedTool === 'rect' && (
                        <Rect
                          {...helpers.getRectProps(startPoint, currentPoint)}
                          stroke={COLOR_ACCENT}
                          strokeWidth={DEFAULT_STROKE_SIZE}
                          dash={[5, 5]}
                          opacity={0.7}
                        />
                      )}
                    </Layer>
                  </Stage>
                )}

                {/* Controls overlay — auto-hides when playing */}
                <div
                  className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 px-5 pb-5 pt-10 transition-all duration-200"
                  style={{
                    background:
                      'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
                    opacity: controlsVisible ? 1 : 0,
                    transform: controlsVisible ? 'translateY(0)' : 'translateY(8px)',
                    pointerEvents: controlsVisible ? 'auto' : 'none',
                  }}
                >
                  <AnnotationTimeline
                    durationMs={durationMs}
                    currentMs={currentMs}
                    annotations={annotations}
                    selectedId={selectedShapeId}
                    onSeek={handleSeek}
                    onMarkerClick={handleMarkerClick}
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <button
                        type="button"
                        onClick={handlePlayPause}
                        disabled={!videoSize}
                        className="text-xl text-white transition-all duration-200 hover:scale-110 hover:text-white disabled:opacity-30"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.85 }}
                      >
                        {isPaused ? '▶' : '⏸'}
                      </button>
                      <span
                        className="text-xs"
                        style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.6)' }}
                      >
                        {formatMs(currentMs)} / {formatMs(durationMs)}
                      </span>
                    </div>

                    <Segmented
                      size="small"
                      value={mode}
                      onChange={(value) => setMode(value as AnnotateMode)}
                      options={[
                        { label: 'View', value: 'view' },
                        { label: 'Select', value: 'select', disabled: !videoSize },
                        { label: 'Rect', value: 'draw-rect', disabled: !videoSize },
                        { label: 'Circle', value: 'draw-circle', disabled: !videoSize },
                      ]}
                      style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Sidebar column ── */}
            <div
              className="flex w-full flex-col overflow-hidden rounded-2xl lg:w-[300px]"
              style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
              }}
            >
              {/* Sidebar header */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <span className="font-bold" style={{ color: 'var(--color-foreground)' }}>
                  Annotations
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                  style={{ background: 'var(--color-primary)' }}
                >
                  {annotations.length}
                </span>
              </div>

              {/* Annotation list */}
              <div className="flex flex-col gap-2 overflow-y-auto p-3">
                {annotations.length === 0 && (
                  <div
                    className="py-10 text-center text-sm"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    <MarkerIcon
                      style={{ fontSize: 28, color: 'var(--color-border)', marginBottom: 12, display: 'block', margin: '0 auto 12px' }}
                    />
                    No annotations yet.
                    <br />
                    <span className="text-xs">Draw a shape on the video to add one.</span>
                  </div>
                )}
                {annotations.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => handleMarkerClick(a.id)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-150"
                    style={{
                      background:
                        selectedShapeId === a.id
                          ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)'
                          : 'color-mix(in srgb, var(--color-muted) 20%, transparent)',
                      border:
                        selectedShapeId === a.id
                          ? '1px solid var(--color-primary)'
                          : '1px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedShapeId !== a.id) {
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                        e.currentTarget.style.background =
                          'color-mix(in srgb, var(--color-muted) 40%, transparent)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedShapeId !== a.id) {
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.background =
                          'color-mix(in srgb, var(--color-muted) 20%, transparent)';
                      }
                    }}
                  >
                    <MarkerIcon
                      style={{
                        fontSize: 18,
                        flexShrink: 0,
                        color:
                          selectedShapeId === a.id
                            ? 'var(--color-primary)'
                            : 'var(--color-accent)',
                      }}
                    />
                    <div className="flex flex-col gap-0.5">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: 'var(--color-foreground)' }}
                      >
                        {a.type === 'rect' ? 'Rectangle' : 'Circle'}
                      </span>
                      <span
                        className="text-xs"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          color: 'var(--color-primary)',
                        }}
                      >
                        {formatMs(a.startMs)} – {formatMs(a.endMs)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Selected annotation range editor */}
              {selectedAnnotation && (
                <div
                  className="p-4"
                  style={{ borderTop: '1px solid var(--color-border)' }}
                >
                  <p
                    className="mb-3 text-xs font-semibold tracking-wide"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    EDIT RANGE — {selectedAnnotation.id.slice(0, 8)}
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-12 text-xs"
                        style={{ color: 'var(--color-muted-foreground)' }}
                      >
                        Start
                      </span>
                      <InputNumber
                        size="small"
                        value={selectedAnnotation.startMs}
                        min={0}
                        max={selectedAnnotation.endMs}
                        addonAfter="ms"
                        onChange={(v) => updateSelectedRange({ startMs: Number(v ?? 0) })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-12 text-xs"
                        style={{ color: 'var(--color-muted-foreground)' }}
                      >
                        End
                      </span>
                      <InputNumber
                        size="small"
                        value={selectedAnnotation.endMs}
                        min={selectedAnnotation.startMs}
                        max={durationMs || undefined}
                        addonAfter="ms"
                        onChange={(v) => updateSelectedRange({ endMs: Number(v ?? 0) })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </CommonLayout>
  );
};

export default HlsVideoMockup;
