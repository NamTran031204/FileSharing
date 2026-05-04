import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Circle, Image as KonvaImage, Layer, Rect, Stage, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import CommonLayout from '../../layout/CommonLayout';

type ToolType = 'select' | 'circle' | 'rect' | 'pan' | 'rotate';

type ShapeType = 'circle' | 'rect';

interface Point {
  x: number;
  y: number;
}

interface BaseShape {
  id: string;
  type: ShapeType;
  rotation?: number;
  stroke: string;
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

const useImage = (url: string) => {
  const [image, setImage] = useState<HTMLImageElement>();

  useEffect(() => {
    const img = new window.Image();
    img.src = url;
    img.onload = () => setImage(img);
  }, [url]);

  return image;
};

const COLOR_PRIMARY = 'hsl(var(--primary))';
const COLOR_ACCENT = 'hsl(var(--accent))';

const getButtonClassName = (isActive: boolean) =>
  [
    'w-full rounded-md px-4 py-2 text-left text-sm font-semibold transition-colors',
    isActive
      ? 'bg-primary text-white border border-primary'
      : 'bg-card text-foreground border border-border hover:border-secondary hover:text-primary',
  ].join(' ');

const KonvaDemo = () => {
  const stageRef = useRef<Konva.Stage | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const shapeRefs = useRef<Record<string, Konva.Shape | null>>({});
  const [selectedTool, setSelectedTool] = useState<ToolType>('select');
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState<Point>({ x: 0, y: 0 });
  const [strokeColor, setStrokeColor] = useState('#4f46e5');

  const bgImage = useImage('/image.jpg');

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

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) {
      return;
    }

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
  }, [selectedTool, selectedShapeId, shapes]);

  const handleStageMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (selectedTool !== 'circle' && selectedTool !== 'rect') {
      return;
    }

    const stage = e.target.getStage();
    const pointerPosition = stage?.getPointerPosition();
    if (!stage || !pointerPosition) {
      return;
    }

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
          newShape = { id: generateId(), type: 'circle', x, y, radius, rotation: 0, stroke: strokeColor };
        }
      }

      if (selectedTool === 'rect') {
        const { x, y, width, height } = getRectProps(startPoint, currentPoint);
        if (width > 2 && height > 2) {
          newShape = { id: generateId(), type: 'rect', x, y, width, height, rotation: 0, stroke: strokeColor };
        }
      }

      if (newShape) {
        setShapes((prev) => [...prev, newShape]);
      }
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };

  const handleStageMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || (selectedTool !== 'circle' && selectedTool !== 'rect')) {
      return;
    }

    const stage = e.target.getStage();
    const pointerPosition = stage?.getPointerPosition();

    if (stage && pointerPosition) {
      setCurrentPoint(getWorldPoint(stage, pointerPosition));
    }
  };

  const handleStageWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) {
      return;
    }

    const oldScale = stageScale;
    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const nextScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.min(5, Math.max(0.3, nextScale));

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

  const handleDragEnd = useCallback((id: string, e: KonvaEventObject<DragEvent>) => {
    setShapes((prevShapes) =>
      prevShapes.map((shape) =>
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
    setShapes((prevShapes) =>
      prevShapes.map((shape) =>
        shape.id === id
          ? {
              ...shape,
              rotation: node.rotation(),
            }
          : shape,
      ),
    );
  }, []);

  const stageWidth = bgImage?.width ?? 800;
  const stageHeight = bgImage?.height ?? 600;
  const stageStyle = useMemo(
    () => ({ cursor: selectedTool === 'select' ? 'default' : 'crosshair' }),
    [selectedTool],
  );

  return (
    <CommonLayout>
      <div className="flex h-full overflow-hidden">


        <section className="flex-1 bg-background p-4 overflow-auto">
          <div className="inline-block rounded-lg border border-border bg-card canvas-shadow">
            <Stage
              ref={stageRef}
              width={stageWidth}
              height={stageHeight}
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
              style={stageStyle}
            >
              <Layer>
                {bgImage && <KonvaImage image={bgImage} x={0} y={0} />}

                {shapes.map((shape) => {
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
                        strokeWidth={3}
                        draggable={isDraggable}
                        onClick={() => setSelectedShapeId(shape.id)}
                        onTap={() => setSelectedShapeId(shape.id)}
                        ref={(node) => {
                          shapeRefs.current[shape.id] = node;
                        }}
                        onDragEnd={(e) => handleDragEnd(shape.id, e)}
                        onTransformEnd={(e) => handleTransformEnd(shape.id, e.target)}
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
                      strokeWidth={3}
                      draggable={isDraggable}
                      onClick={() => setSelectedShapeId(shape.id)}
                      onTap={() => setSelectedShapeId(shape.id)}
                      ref={(node) => {
                        shapeRefs.current[shape.id] = node;
                      }}
                      onDragEnd={(e) => handleDragEnd(shape.id, e)}
                      onTransformEnd={(e) => handleTransformEnd(shape.id, e.target)}
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
                        strokeWidth={2}
                        dash={[5, 5]}
                        opacity={0.7}
                      />
                    )}
                    {selectedTool === 'rect' && (
                      <Rect
                        {...getRectProps(startPoint, currentPoint)}
                        stroke={COLOR_ACCENT}
                        strokeWidth={2}
                        dash={[5, 5]}
                        opacity={0.7}
                      />
                    )}
                  </>
                )}
              </Layer>
            </Stage>
          </div>
        </section>

        <aside className="w-64 shrink-0 bg-card border-r border-border p-5 flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-foreground">Công cụ vẽ</h2>

          <button onClick={() => setSelectedTool('select')} className={getButtonClassName(selectedTool === 'select')}>
            move
          </button>
          <button onClick={() => setSelectedTool('circle')} className={getButtonClassName(selectedTool === 'circle')}>
            circle
          </button>
          <button onClick={() => setSelectedTool('rect')} className={getButtonClassName(selectedTool === 'rect')}>
            rect
          </button>
          <button onClick={() => setSelectedTool('pan')} className={getButtonClassName(selectedTool === 'pan')}>
            pan
          </button>
          <button onClick={() => setSelectedTool('rotate')} className={getButtonClassName(selectedTool === 'rotate')}>
            rotate
          </button>
          <div className="rounded-md border border-border bg-background p-3">
            <p className="text-sm font-semibold text-foreground">Mau ve</p>
            <div className="mt-2">
              <HexColorPicker color={strokeColor} onChange={setStrokeColor} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="h-4 w-4 rounded-full border border-border"
                style={{ backgroundColor: strokeColor }}
              />
              <span className="text-xs font-medium text-muted-foreground">{strokeColor}</span>
            </div>
          </div>
          <button
            onClick={() => {
              const payload = {
                image: {
                  src: '/image.jpg',
                  naturalWidth: bgImage?.naturalWidth ?? stageWidth,
                  naturalHeight: bgImage?.naturalHeight ?? stageHeight,
                },
                stage: {
                  width: stageWidth,
                  height: stageHeight,
                  scale: stageScale,
                  position: stagePosition,
                },
                shapes,
              };

              console.log('Konva demo payload:', payload);
            }}
            className="w-full rounded-md border border-border bg-secondary px-4 py-2 text-left text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            type="button"
          >
            Lưu
          </button>
        </aside>
      </div>
    </CommonLayout>
  );
};

export default KonvaDemo;
