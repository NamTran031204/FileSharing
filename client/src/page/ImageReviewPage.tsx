import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import CommonLayout from '../layout/CommonLayout';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Circle, Image as KonvaImage, Layer, Rect, Stage, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import useImage from 'use-image';
import { useMeasure } from 'react-use';

import CanvasHeader from '../components/imageReview/CanvasHeader';
import CapsuleControls from '../components/imageReview/CapsuleControls';
import CollapsibleSection from '../components/imageReview/CollapsibleSection';
import ShapesPanel from '../components/imageReview/ShapesPanel';
import CommentsPanel from '../components/imageReview/CommentsPanel';
import ActionLogPanel from '../components/imageReview/ActionLogPanel';
import ImageInfoPanel from '../components/imageReview/ImageInfoPanel';
import { mockActionLog, mockComments, mockImages, shapes } from '../components/imageReview/mockData';
import type { SidebarSectionState } from '../components/imageReview/types';

// =====================================================================
// Konva types (kept identical to ImageReviewV2 — logic is unchanged here)
// =====================================================================

type MarkupMode = 'select' | 'draw' | 'text';
type ShapeTool = 'rectangle' | 'circle' | 'gesture';
type ToolType = 'select' | 'circle' | 'rect' | 'pan' | 'rotate';

interface Point {
  x: number;
  y: number;
}

interface BaseShape {
  id: string;
  type: 'circle' | 'rect';
  rotation?: number;
  stroke: string;
  strokeWidth: number;
}

interface CircleShape extends BaseShape {
  type: 'circle';
  x: number;
  y: number;
  radius: number;
}

interface RectShape extends BaseShape {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
}

type Shape = CircleShape | RectShape;

const COLOR_PRIMARY = 'hsl(var(--primary))';
const COLOR_ACCENT = 'hsl(var(--accent))';

const DEFAULT_STROKE_COLOR = COLOR_PRIMARY;
const DEFAULT_STROKE_SIZE = 4;

const ImageReviewPage = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const currentImage = mockImages[currentImageIndex];

  const [activeMode, setActiveMode] = useState<MarkupMode>('select');
  const [activeShape, setActiveShape] = useState<ShapeTool>('rectangle');
  const [selectedTool, setSelectedTool] = useState<ToolType>('select');

  const stageRef = useRef<Konva.Stage | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const shapeRefs = useRef<Record<string, Konva.Shape | null>>({});

  const [containerRef, { width: containerWidth, height: containerHeight }] =
    useMeasure<HTMLDivElement>();

  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [drawnShapes, setDrawnShapes] = useState<Shape[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState<Point>({ x: 0, y: 0 });

  const [bgImage] = useImage(currentImage.url);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<SidebarSectionState>({
    shapes: false,
    comments: true,
    actionLog: false,
    imageInfo: true,
  });
  const [commentToolActive, setCommentToolActive] = useState(false);

  useEffect(() => {
    if (activeMode === 'select') {
      setSelectedTool('select');
      return;
    }
    if (activeMode === 'text') {
      setSelectedTool('pan');
      return;
    }
    if (activeMode === 'draw') {
      if (activeShape === 'circle') {
        setSelectedTool('circle');
      } else if (activeShape === 'rectangle') {
        setSelectedTool('rect');
      } else {
        setSelectedTool('rotate');
      }
    }
  }, [activeMode, activeShape]);

  useEffect(() => {
    if (bgImage && containerWidth > 0 && containerHeight > 0) {
      const scaleX = containerWidth / bgImage.width;
      const scaleY = containerHeight / bgImage.height;
      const nextScale = Math.min(scaleX, scaleY) * 0.9;

      setStageScale(nextScale);
      setStagePosition({
        x: (containerWidth - bgImage.width * nextScale) / 2,
        y: (containerHeight - bgImage.height * nextScale) / 2,
      });
    }
  }, [bgImage, containerWidth, containerHeight]);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    if (selectedTool !== 'rotate' || !selectedShapeId) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const node = shapeRefs.current[selectedShapeId];
    if (node) {
      transformer.nodes([node]);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedTool, selectedShapeId, drawnShapes]);

  const generateId = () => Math.random().toString(36).slice(2, 9);

  const getCircleProps = (p1: Point, p2: Point) => ({
    x: p1.x,
    y: p1.y,
    radius: Math.hypot(p2.x - p1.x, p2.y - p1.y),
  });

  const getRectProps = (p1: Point, p2: Point) => ({
    x: Math.min(p1.x, p2.x),
    y: Math.min(p1.y, p2.y),
    width: Math.abs(p2.x - p1.x),
    height: Math.abs(p2.y - p1.y),
  });

  const getWorldPoint = (stage: Konva.Stage, pointerPosition: Point) => {
    const transform = stage.getAbsoluteTransform().copy().invert();
    return transform.point(pointerPosition);
  };

  const handleStageMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (selectedTool !== 'circle' && selectedTool !== 'rect') {
      if (e.target === e.target.getStage() || e.target.constructor.name === 'Image') {
        setSelectedShapeId(null);
      }
      return;
    }

    const stage = e.target.getStage();
    const pointerPosition = stage?.getPointerPosition();
    if (!stage || !pointerPosition) return;

    const worldPosition = getWorldPoint(stage, pointerPosition);

    if (!isDrawing) {
      setIsDrawing(true);
      setStartPoint(worldPosition);
      setCurrentPoint(worldPosition);
      return;
    }

    if (startPoint && currentPoint) {
      let newShape: Shape | null = null;

      if (selectedTool === 'circle') {
        const { x, y, radius } = getCircleProps(startPoint, currentPoint);
        if (radius > 2) {
          newShape = {
            id: generateId(),
            type: 'circle',
            x,
            y,
            radius,
            rotation: 0,
            stroke: DEFAULT_STROKE_COLOR,
            strokeWidth: DEFAULT_STROKE_SIZE,
          };
        }
      }

      if (selectedTool === 'rect') {
        const { x, y, width, height } = getRectProps(startPoint, currentPoint);
        if (width > 2 && height > 2) {
          newShape = {
            id: generateId(),
            type: 'rect',
            x,
            y,
            width,
            height,
            rotation: 0,
            stroke: DEFAULT_STROKE_COLOR,
            strokeWidth: DEFAULT_STROKE_SIZE,
          };
        }
      }

      if (newShape) {
        setDrawnShapes((prev) => [...prev, newShape!]);
      }
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };

  const handleStageMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || (selectedTool !== 'circle' && selectedTool !== 'rect')) return;

    const stage = e.target.getStage();
    const pointerPosition = stage?.getPointerPosition();

    if (stage && pointerPosition) {
      setCurrentPoint(getWorldPoint(stage, pointerPosition));
    }
  };

  const handleStageWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const oldScale = stageScale;
    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const nextScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.min(5, Math.max(0.1, nextScale));

    const mousePointTo = {
      x: (pointerPosition.x - stagePosition.x) / oldScale,
      y: (pointerPosition.y - stagePosition.y) / oldScale,
    };

    const nextPosition = {
      x: pointerPosition.x - mousePointTo.x * clampedScale,
      y: pointerPosition.y - mousePointTo.y * clampedScale,
    };

    setStageScale(clampedScale);
    setStagePosition(nextPosition);
  };

  const zoomBy = (delta: number) => {
    if (containerWidth <= 0 || containerHeight <= 0) return;

    const stage = stageRef.current;
    const basePoint = stage?.getPointerPosition() ?? {
      x: containerWidth / 2,
      y: containerHeight / 2,
    };
    const oldScale = stageScale;
    const nextScale = Math.min(5, Math.max(0.3, oldScale + delta));
    const mousePointTo = {
      x: (basePoint.x - stagePosition.x) / oldScale,
      y: (basePoint.y - stagePosition.y) / oldScale,
    };
    const nextPosition = {
      x: basePoint.x - mousePointTo.x * nextScale,
      y: basePoint.y - mousePointTo.y * nextScale,
    };

    setStageScale(nextScale);
    setStagePosition(nextPosition);
  };

  const handleZoomIn = () => zoomBy(0.1);
  const handleZoomOut = () => zoomBy(-0.1);

  const handleDragEnd = useCallback((id: string, e: KonvaEventObject<DragEvent>) => {
    setDrawnShapes((prev) =>
      prev.map((shape) =>
        shape.id === id
          ? {
              ...shape,
              x: e.target.x(),
              y: e.target.y(),
            }
          : shape,
      ),
    );
  }, []);

  const handleTransformEnd = useCallback((id: string, node: Konva.Shape) => {
    setDrawnShapes((prev) =>
      prev.map((shape) =>
        shape.id === id
          ? {
              ...shape,
              rotation: node.rotation(),
            }
          : shape,
      ),
    );
  }, []);

  const canGoPrev = currentImageIndex > 0;
  const canGoNext = currentImageIndex < mockImages.length - 1;

  const handlePrevImage = () => {
    if (!canGoPrev) return;
    setCurrentImageIndex((prev) => prev - 1);
    setDrawnShapes([]);
    setSelectedShapeId(null);
  };

  const handleNextImage = () => {
    if (!canGoNext) return;
    setCurrentImageIndex((prev) => prev + 1);
    setDrawnShapes([]);
    setSelectedShapeId(null);
  };

  const toggleSection = (section: keyof SidebarSectionState) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleTogglePan = () => {
    if (selectedTool === 'pan') {
      setActiveMode('select');
    } else {
      setActiveMode('text');
    }
  };

  const handleToggleComment = () => {
    setCommentToolActive((prev) => !prev);
    // Mở Comments section khi bật comment tool
    setExpandedSections((prev) => ({ ...prev, comments: true }));
  };

  const handleShapeSelect = (shapeId: string) => {
    const currentShapeActive =
      activeMode === 'draw' && (activeShape === shapeId || (shapeId === 'arrow' && activeShape === 'gesture'));

    if (currentShapeActive) {
      setActiveMode('select');
      return;
    }

    if (shapeId === 'rectangle') {
      setActiveMode('draw');
      setActiveShape('rectangle');
    } else if (shapeId === 'circle') {
      setActiveMode('draw');
      setActiveShape('circle');
    } else if (shapeId === 'arrow') {
      // TODO: V2 chưa hỗ trợ arrow — map sang gesture (rotate) tạm
      setActiveMode('draw');
      setActiveShape('gesture');
    }
  };

  const handleReplyComment = (commentId: number) => {
    // TODO: implement reply — V2 hiện không có flow reply
    console.log('Reply to comment:', commentId);
  };

  // Derived state cho UI
  const activeShapeIdForUI =
    activeMode === 'draw'
      ? activeShape === 'rectangle'
        ? 'rectangle'
        : activeShape === 'circle'
        ? 'circle'
        : 'arrow'
      : null;
  const isPanActive = selectedTool === 'pan';
  const zoomPercent = Math.round(stageScale * 100);

  const viewportCursor =
    selectedTool === 'select' ? 'default' : selectedTool === 'pan' ? 'grab' : 'crosshair';

  return (
    <CommonLayout>
    <div className="relative flex h-full overflow-hidden bg-card">
      {/* ============================ Canvas Area ============================ */}
      <div className="relative flex flex-1 flex-col overflow-hidden bg-background">
        <CanvasHeader
          imageName={currentImage.name}
          currentIndex={currentImageIndex}
          total={mockImages.length}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={handlePrevImage}
          onNext={handleNextImage}
        />

        {/* Viewport */}
        <div
          ref={containerRef}
          className="relative flex flex-1 items-center justify-center overflow-hidden"
          style={{ cursor: viewportCursor }}
        >
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
              onDragEnd={() => {
                const stage = stageRef.current;
                if (stage) {
                  setStagePosition({ x: stage.x(), y: stage.y() });
                }
              }}
            >
              <Layer>
                {bgImage && <KonvaImage image={bgImage} x={0} y={0} />}

                {drawnShapes.map((shape) => {
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
                        onClick={() => selectedTool === 'select' && setSelectedShapeId(shape.id)}
                        onTap={() => selectedTool === 'select' && setSelectedShapeId(shape.id)}
                        ref={(node) => {
                          shapeRefs.current[shape.id] = node;
                        }}
                        onDragEnd={(e) => handleDragEnd(shape.id, e)}
                        onTransformEnd={(e) =>
                          handleTransformEnd(shape.id, e.target as Konva.Shape)
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
                      onClick={() => selectedTool === 'select' && setSelectedShapeId(shape.id)}
                      onTap={() => selectedTool === 'select' && setSelectedShapeId(shape.id)}
                      ref={(node) => {
                        shapeRefs.current[shape.id] = node;
                      }}
                      onDragEnd={(e) => handleDragEnd(shape.id, e)}
                      onTransformEnd={(e) =>
                        handleTransformEnd(shape.id, e.target as Konva.Shape)
                      }
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

                {isDrawing && startPoint && currentPoint && (
                  <>
                    {selectedTool === 'circle' && (
                      <Circle
                        {...getCircleProps(startPoint, currentPoint)}
                        stroke={COLOR_PRIMARY}
                        strokeWidth={DEFAULT_STROKE_SIZE}
                        dash={[5, 5]}
                        opacity={0.7}
                      />
                    )}
                    {selectedTool === 'rect' && (
                      <Rect
                        {...getRectProps(startPoint, currentPoint)}
                        stroke={COLOR_ACCENT}
                        strokeWidth={DEFAULT_STROKE_SIZE}
                        dash={[5, 5]}
                        opacity={0.7}
                      />
                    )}
                  </>
                )}
              </Layer>
            </Stage>
          )}

          {/* Bottom capsule controls */}
          <CapsuleControls
            zoomPercent={zoomPercent}
            isPanActive={isPanActive}
            isCommentActive={commentToolActive}
            onTogglePan={handleTogglePan}
            onToggleComment={handleToggleComment}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
          />
        </div>

      </div>
        {sidebarCollapsed && (
            <Button
                icon={<LeftOutlined />}
                onClick={() => setSidebarCollapsed(false)}
                title="Hide sidebar"
                className="absolute right-[0px] top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md border-border bg-background text-foreground"
            />
        )}

      {/* ============================ Right Sidebar ============================ */}
      <aside
        className={`flex flex-col overflow-hidden border-l border-border/40 bg-card transition-[width] duration-300 ${
          sidebarCollapsed ? 'w-0' : 'w-80'
        }`}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <CollapsibleSection
            title="Shapes"
            expanded={expandedSections.shapes}
            onToggle={() => toggleSection('shapes')}
          >
            <ShapesPanel
              shapes={shapes}
              activeShapeId={activeShapeIdForUI}
              onSelect={handleShapeSelect}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title={`Comments (${mockComments.length})`}
            expanded={expandedSections.comments}
            onToggle={() => toggleSection('comments')}
          >
            <CommentsPanel comments={mockComments} onReply={handleReplyComment} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Action Log"
            expanded={expandedSections.actionLog}
            onToggle={() => toggleSection('actionLog')}
          >
            <ActionLogPanel items={mockActionLog} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Image Info"
            expanded={expandedSections.imageInfo}
            onToggle={() => toggleSection('imageInfo')}
          >
            <ImageInfoPanel image={currentImage} />
          </CollapsibleSection>
        </div>
      </aside>
        {!sidebarCollapsed && (
            <Button
                icon={<RightOutlined />}
                onClick={() => setSidebarCollapsed(true)}
                title="Hide sidebar"
                className="absolute right-[336px] top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md border-border bg-card text-foreground"
            />
        )}
    </div>
    </CommonLayout>
  );
};

export default ImageReviewPage;
