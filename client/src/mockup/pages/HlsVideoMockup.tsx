import {
  PauseCircleOutlined,
  PlayCircleOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { Button, Card, InputNumber, Segmented, Space, Tag, Typography } from 'antd';
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

  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [videoSize, setVideoSize] = useState<{ width: number; height: number } | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [isPaused, setIsPaused] = useState(true);

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
    zoomPercent,
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
            return {
              ...a,
              x: s.x,
              y: s.y,
              radius: s.radius,
              rotation: s.rotation ?? 0,
            };
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
      <div className="flex-1 overflow-y-auto bg-background p-6 md:p-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
          <Card className="rounded-2xl border border-border bg-card shadow-sm">
            <Space direction="vertical" size={12} className="w-full">
              <Tag className="w-fit border border-accent/40 bg-accent/20 px-3 py-1 text-xs font-semibold text-primary-dark">
                MOCKUP HLS PLAYER + KONVA
              </Tag>
              <Title level={2} className="!mb-0 !text-foreground">
                Mockup Konva trên HLS video
              </Title>
            </Space>
          </Card>

          <Card className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-primary-dark">
              <div className="flex items-center gap-2">
                <VideoCameraOutlined />
                preview
              </div>
              <Segmented
                value={mode}
                onChange={(value) => setMode(value as AnnotateMode)}
                options={[
                  { label: 'View', value: 'view' },
                  { label: 'Select', value: 'select', disabled: !videoSize },
                  { label: 'Rect', value: 'draw-rect', disabled: !videoSize },
                  { label: 'Circle', value: 'draw-circle', disabled: !videoSize },
                ]}
              />
            </div>

            <div
              ref={containerRef}
              className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black"
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
            </div>

            {/* Custom controls */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button
                type="primary"
                icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                onClick={handlePlayPause}
                disabled={!videoSize}
              >
                {isPaused ? 'Play' : 'Pause'}
              </Button>
              <span className="text-xs text-muted-foreground">
                {Math.floor(currentMs / 1000)}s / {Math.floor(durationMs / 1000)}s ·
                {' '}zoom {zoomPercent}%
              </span>
            </div>

            <div className="mt-3">
              <AnnotationTimeline
                durationMs={durationMs}
                currentMs={currentMs}
                annotations={annotations}
                selectedId={selectedShapeId}
                onSeek={handleSeek}
                onMarkerClick={handleMarkerClick}
              />
            </div>
          </Card>

          <Card className="rounded-2xl border border-border bg-card shadow-sm">
            <Title level={5} className="!mb-2 !text-foreground">
              Annotations ({annotations.length})
            </Title>
            <div className="flex flex-col gap-2 text-sm">
              {annotations.length === 0 && (
                <div className="text-muted-foreground">Chưa có annotation.</div>
              )}
              {annotations.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleMarkerClick(a.id)}
                  className={`flex items-center justify-between rounded border px-3 py-2 text-left transition ${
                    selectedShapeId === a.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  <span className="font-mono text-xs">{a.id.slice(0, 10)}</span>
                  <span>{a.type}</span>
                  <span className="text-muted-foreground">
                    {a.startMs}–{a.endMs} ms
                  </span>
                </button>
              ))}
            </div>

            {selectedAnnotation && (
              <div className="mt-4 flex flex-col gap-2 border-t border-border pt-3">
                <Title level={5} className="!mb-1 !text-foreground">
                  Range — {selectedAnnotation.id.slice(0, 10)}
                </Title>
                <div className="flex items-center gap-2">
                  <span className="w-16 text-xs text-muted-foreground">Start (ms)</span>
                  <InputNumber
                    value={selectedAnnotation.startMs}
                    min={0}
                    max={selectedAnnotation.endMs}
                    onChange={(v) => updateSelectedRange({ startMs: Number(v ?? 0) })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16 text-xs text-muted-foreground">End (ms)</span>
                  <InputNumber
                    value={selectedAnnotation.endMs}
                    min={selectedAnnotation.startMs}
                    max={durationMs || undefined}
                    onChange={(v) => updateSelectedRange({ endMs: Number(v ?? 0) })}
                  />
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </CommonLayout>
  );
};

export default HlsVideoMockup;
