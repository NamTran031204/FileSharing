import { Circle, Image as KonvaImage, Layer, Rect, Stage, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaShapeData } from '../../utils/coordinateTransform';
import type { StrokeColor } from './constants';
import { LeftToolbar } from './LeftToolbar';
import { BottomCapsuleControls } from './BottomCapsuleControls';

type ToolId = 'select' | 'rect' | 'circle' | 'arrow' | 'pan';

interface CanvasState {
  containerRef: React.RefCallback<HTMLDivElement>;
  containerWidth: number;
  containerHeight: number;
  stageRef: React.RefObject<Konva.Stage | null>;
  transformerRef: React.RefObject<Konva.Transformer | null>;
  shapeRefs: React.MutableRefObject<Record<string, Konva.Shape | null>>;
  stageScale: number;
  stagePosition: { x: number; y: number };
  selectedTool: string;
  drawnShapes: Shape[];
  isDrawing: boolean;
  startPoint: Point | null;
  currentPoint: Point | null;
  zoomPercent: number;
  handlers: {
    handleStageMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
    handleStageMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
    handleStageWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
    handleStageDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
    handleZoomIn: () => void;
    handleZoomOut: () => void;
    handleDragEnd: (id: string, e: Konva.KonvaEventObject<DragEvent>) => void;
    handleTransformEnd: (id: string, node: Konva.Shape) => void;
  };
  helpers: {
    getCircleProps: (p1: Point, p2: Point) => { x: number; y: number; radius: number };
    getRectProps: (p1: Point, p2: Point) => { x: number; y: number; width: number; height: number };
  };
}

interface Point { x: number; y: number; }
interface Shape {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  stroke: string;
  strokeWidth: number;
  rotation?: number;
}

interface ImagePlayerProps {
  bgImage: HTMLImageElement | undefined;
  isImageLoading: boolean;
  isInitialLoading: boolean;
  allKonvaShapes: KonvaShapeData[];
  showAnnotations: boolean;
  highlightedAnnotationId: string | null;
  activeTool: ToolId | string;
  activeColor: StrokeColor;
  viewportCursor: string;
  viewportDivRef: React.MutableRefObject<HTMLDivElement | null>;
  canvas: CanvasState;
  onHighlightAnnotation: (id: string | null) => void;
  onToolClick: (tool: ToolId) => void;
  onColorChange: (c: StrokeColor) => void;
  onZoomFit: () => void;
  onZoom100: () => void;
  onToggleAnnotations: () => void;
  setSelectedShapeId: (id: string | null) => void;
}

export function ImagePlayer({
  bgImage,
  isImageLoading,
  isInitialLoading,
  allKonvaShapes,
  showAnnotations,
  highlightedAnnotationId,
  activeTool,
  activeColor,
  viewportCursor,
  viewportDivRef,
  canvas,
  onHighlightAnnotation,
  onToolClick,
  onColorChange,
  onZoomFit,
  onZoom100,
  onToggleAnnotations,
  setSelectedShapeId,
}: ImagePlayerProps) {
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
    drawnShapes,
    isDrawing,
    startPoint,
    currentPoint,
    zoomPercent,
    handlers,
    helpers,
  } = canvas;

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-zinc-950">
      <LeftToolbar
        activeTool={activeTool}
        activeColor={activeColor}
        onToolClick={onToolClick}
        onColorChange={onColorChange}
      />

      {/* Konva canvas viewport */}
      <div
        ref={el => {
          (containerRef as React.RefCallback<HTMLDivElement>)(el);
          viewportDivRef.current = el;
        }}
        className="relative flex w-full flex-1 items-center justify-center overflow-hidden"
        style={{ cursor: viewportCursor }}
      >
        {(isImageLoading || isInitialLoading) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/60">
            <div className="text-sm text-zinc-400">Loading image…</div>
          </div>
        )}

        {containerWidth > 0 && containerHeight > 0 && (
          <Stage
            ref={stageRef}
            width={containerWidth}
            height={containerHeight}
            onMouseDown={handlers.handleStageMouseDown}
            onMouseMove={handlers.handleStageMouseMove}
            onWheel={handlers.handleStageWheel}
            scale={{ x: stageScale, y: stageScale }}
            position={stagePosition}
            draggable={selectedTool === 'pan'}
            onDragEnd={handlers.handleStageDragEnd}
          >
            <Layer>
              {bgImage && <KonvaImage image={bgImage} x={0} y={0} />}

              {/* Saved annotation shapes */}
              {showAnnotations && allKonvaShapes.map(shape => {
                const isHl = !highlightedAnnotationId ||
                  shape.annotationId === highlightedAnnotationId;
                const opacity = isHl ? 1 : 0.35;
                const onClick = () =>
                  onHighlightAnnotation(
                    highlightedAnnotationId === shape.annotationId
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
                      onDragEnd={e => handlers.handleDragEnd(shape.id, e)}
                      onTransformEnd={e => handlers.handleTransformEnd(shape.id, e.target as Konva.Shape)}
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
                    onDragEnd={e => handlers.handleDragEnd(shape.id, e)}
                    onTransformEnd={e => handlers.handleTransformEnd(shape.id, e.target as Konva.Shape)}
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
                      {...helpers.getCircleProps(startPoint, currentPoint)}
                      stroke={activeColor}
                      strokeWidth={4}
                      dash={[5, 5]}
                      opacity={0.7}
                    />
                  )}
                  {selectedTool === 'rect' && (
                    <Rect
                      {...helpers.getRectProps(startPoint, currentPoint)}
                      stroke={activeColor}
                      strokeWidth={4}
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

      <BottomCapsuleControls
        activeTool={activeTool}
        zoomPercent={zoomPercent}
        showAnnotations={showAnnotations}
        onTogglePan={() => onToolClick(activeTool === 'pan' ? 'select' : 'pan')}
        onZoomIn={handlers.handleZoomIn}
        onZoomOut={handlers.handleZoomOut}
        onZoomFit={onZoomFit}
        onZoom100={onZoom100}
        onToggleAnnotations={onToggleAnnotations}
      />
    </div>
  );
}
