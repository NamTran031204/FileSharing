import { useCallback, useEffect, useRef, useState } from 'react';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useMeasure } from 'react-use';

export type MarkupMode = 'select' | 'draw' | 'text';
export type ShapeTool = 'rectangle' | 'circle' | 'gesture';
export type ToolType = 'select' | 'circle' | 'rect' | 'pan' | 'rotate';

export interface Point {
  x: number;
  y: number;
}

export interface BaseShape {
  id: string;
  type: 'circle' | 'rect';
  rotation?: number;
  stroke: string;
  strokeWidth: number;
}

export interface CircleShape extends BaseShape {
  type: 'circle';
  x: number;
  y: number;
  radius: number;
}

export interface RectShape extends BaseShape {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Shape = CircleShape | RectShape;

const HOOK_COLOR_PRIMARY = 'hsl(var(--primary))';
const HOOK_DEFAULT_STROKE_COLOR = HOOK_COLOR_PRIMARY;
const HOOK_DEFAULT_STROKE_SIZE = 4;

export interface UseKonvaCanvasOptions {
  worldWidth: number | undefined;
  worldHeight: number | undefined;
  fitPadding?: number;
  minScale?: number;
  maxScale?: number;
  minZoomBy?: number;
  maxZoomBy?: number;
  zoomByStep?: number;
  wheelScaleBy?: number;
  defaultStrokeColor?: string;
  defaultStrokeSize?: number;
}

const useKonvaCanvas = (options: UseKonvaCanvasOptions) => {
  const {
    worldWidth,
    worldHeight,
    fitPadding = 0.9,
    minScale = 0.1,
    maxScale = 5,
    minZoomBy = 0.3,
    maxZoomBy = 5,
    zoomByStep = 0.1,
    wheelScaleBy = 1.05,
    defaultStrokeColor = HOOK_DEFAULT_STROKE_COLOR,
    defaultStrokeSize = HOOK_DEFAULT_STROKE_SIZE,
  } = options;

  const stageRef = useRef<Konva.Stage | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const shapeRefs = useRef<Record<string, Konva.Shape | null>>({});

  const [containerRef, { width: containerWidth, height: containerHeight }] =
    useMeasure<HTMLDivElement>();

  const [selectedTool, setSelectedTool] = useState<ToolType>('select');
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [drawnShapes, setDrawnShapes] = useState<Shape[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState<Point>({ x: 0, y: 0 });

  useEffect(() => {
    if (worldWidth && worldHeight && containerWidth > 0 && containerHeight > 0) {
      const scaleX = containerWidth / worldWidth;
      const scaleY = containerHeight / worldHeight;
      const nextScale = Math.min(scaleX, scaleY) * fitPadding;

      setStageScale(nextScale);
      setStagePosition({
        x: (containerWidth - worldWidth * nextScale) / 2,
        y: (containerHeight - worldHeight * nextScale) / 2,
      });
    }
  }, [worldWidth, worldHeight, containerWidth, containerHeight, fitPadding]);

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
            stroke: defaultStrokeColor,
            strokeWidth: defaultStrokeSize,
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
            stroke: defaultStrokeColor,
            strokeWidth: defaultStrokeSize,
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
    const scaleBy = wheelScaleBy;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const nextScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.min(maxScale, Math.max(minScale, nextScale));

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
    const nextScale = Math.min(maxZoomBy, Math.max(minZoomBy, oldScale + delta));
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

  const handleZoomIn = () => zoomBy(zoomByStep);
  const handleZoomOut = () => zoomBy(-zoomByStep);

  const handleStageDragEnd = () => {
    const stage = stageRef.current;
    if (stage) {
      setStagePosition({ x: stage.x(), y: stage.y() });
    }
  };

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

  const zoomPercent = Math.round(stageScale * 100);

  return {
    containerRef,
    containerWidth,
    containerHeight,
    stageRef,
    transformerRef,
    shapeRefs,
    stageScale,
    stagePosition,
    setStagePosition,
    selectedTool,
    setSelectedTool,
    drawnShapes,
    setDrawnShapes,
    selectedShapeId,
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
    helpers: {
      getCircleProps,
      getRectProps,
      getWorldPoint,
      generateId,
    },
    zoomPercent,
  };
};

export default useKonvaCanvas;
