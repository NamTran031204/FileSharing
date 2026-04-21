import { useCallback, useEffect, useMemo, useState } from 'react';
import { Circle, Image as KonvaImage, Layer, Rect, Stage } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import CommonLayout from '../../layout/CommonLayout';

type ToolType = 'select' | 'circle' | 'rect';

type ShapeType = 'circle' | 'rect';

interface Point {
  x: number;
  y: number;
}

interface BaseShape {
  id: string;
  type: ShapeType;
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
  const [selectedTool, setSelectedTool] = useState<ToolType>('select');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);

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

  const handleStageMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (selectedTool === 'select') {
      return;
    }

    const stage = e.target.getStage();
    const pointerPosition = stage?.getPointerPosition();
    if (!pointerPosition) {
      return;
    }

    if (!isDrawing) {
      setIsDrawing(true);
      setStartPoint(pointerPosition);
      setCurrentPoint(pointerPosition);
      return;
    }

    if (startPoint && currentPoint) {
      let newShape: Shape | null = null;

      if (selectedTool === 'circle') {
        const { x, y, radius } = getCircleProps(startPoint, currentPoint);
        if (radius > 2) {
          newShape = { id: generateId(), type: 'circle', x, y, radius };
        }
      }

      if (selectedTool === 'rect') {
        const { x, y, width, height } = getRectProps(startPoint, currentPoint);
        if (width > 2 && height > 2) {
          newShape = { id: generateId(), type: 'rect', x, y, width, height };
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
    if (!isDrawing || selectedTool === 'select') {
      return;
    }

    const stage = e.target.getStage();
    const pointerPosition = stage?.getPointerPosition();

    if (pointerPosition) {
      setCurrentPoint(pointerPosition);
    }
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
              width={stageWidth}
              height={stageHeight}
              onMouseDown={handleStageMouseDown}
              onMouseMove={handleStageMouseMove}
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
                        stroke={COLOR_PRIMARY}
                        strokeWidth={3}
                        draggable={isDraggable}
                        onDragEnd={(e) => handleDragEnd(shape.id, e)}
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
                      stroke={COLOR_ACCENT}
                      strokeWidth={3}
                      draggable={isDraggable}
                      onDragEnd={(e) => handleDragEnd(shape.id, e)}
                    />
                  );
                })}

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
          </aside>
      </div>
    </CommonLayout>
  );
};

export default KonvaDemo;
