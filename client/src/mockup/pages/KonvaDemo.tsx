import React, { useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Rect } from 'react-konva';
import type {KonvaEventObject} from 'konva/lib/Node';

// --- TYPES & INTERFACES ---
type ToolType = 'select' | 'circle' | 'rect';

interface Point {
    x: number;
    y: number;
}

interface BaseShape {
    id: string;
    type: ToolType;
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
    const [image, setImage] = useState<HTMLImageElement | undefined>();

    useEffect(() => {
        const img = new window.Image();
        img.src = url;
        img.onload = () => {
            setImage(img);
        };
    }, [url]);

    return image;
};

const KonvaDemo: React.FC = () => {
    const [selectedTool, setSelectedTool] = useState<ToolType>('select');
    const [shapes, setShapes] = useState<Shape[]>([]);

    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [startPoint, setStartPoint] = useState<Point | null>(null);
    const [currentPoint, setCurrentPoint] = useState<Point | null>(null);

    const bgImage = useImage('/image.jpg');

    // Helpers
    const generateId = () => Math.random().toString(36).substring(2, 9);

    // Tính toán thông số hình Tròn dựa trên 2 điểm
    const getCircleProps = (p1: Point, p2: Point) => {
        const radius = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        return { x: p1.x, y: p1.y, radius };
    };

    // Tính toán thông số hình Chữ Nhật dựa trên 2 điểm (hỗ trợ kéo ngược về mọi hướng)
    const getRectProps = (p1: Point, p2: Point) => {
        return {
            x: Math.min(p1.x, p2.x),
            y: Math.min(p1.y, p2.y),
            width: Math.abs(p2.x - p1.x),
            height: Math.abs(p2.y - p1.y),
        };
    };

    const handleStageMouseDown = (e: KonvaEventObject<MouseEvent>) => {
        if (selectedTool === 'select') return; // Không làm gì nếu đang ở chế độ select

        const stage = e.target.getStage();
        const pointerPosition = stage?.getPointerPosition();
        if (!pointerPosition) return;

        if (!isDrawing) {
            // click lần 1 -> Bắt đầu vẽ
            setIsDrawing(true);
            setStartPoint(pointerPosition);
            setCurrentPoint(pointerPosition);
        } else {
            // click lần 2 -> Hoàn tất vẽ và lưu hình
            if (startPoint && currentPoint) {
                let newShape: Shape | null = null;

                if (selectedTool === 'circle') {
                    const { x, y, radius } = getCircleProps(startPoint, currentPoint);
                    // Chỉ lưu nếu có kích thước hợp lệ
                    if (radius > 2) {
                        newShape = { id: generateId(), type: 'circle', x, y, radius };
                    }
                } else if (selectedTool === 'rect') {
                    const { x, y, width, height } = getRectProps(startPoint, currentPoint);
                    if (width > 2 && height > 2) {
                        newShape = { id: generateId(), type: 'rect', x, y, width, height };
                    }
                }

                if (newShape) {
                    setShapes((prev) => [...prev, newShape!]);
                }
            }

            // Reset trạng thái vẽ
            setIsDrawing(false);
            setStartPoint(null);
            setCurrentPoint(null);
        }
    };

    const handleStageMouseMove = (e: KonvaEventObject<MouseEvent>) => {
        if (!isDrawing || selectedTool === 'select') return;

        const stage = e.target.getStage();
        const pointerPosition = stage?.getPointerPosition();

        if (pointerPosition) {
            setCurrentPoint(pointerPosition);
        }
    };

    // Cập nhật tọa độ khi người dùng kéo thả hình (Drag & Drop)
    const handleDragEnd = useCallback((id: string, e: KonvaEventObject<DragEvent>) => {
        setShapes((prevShapes) =>
            prevShapes.map((shape) => {
                if (shape.id === id) {
                    return {
                        ...shape,
                        x: e.target.x(),
                        y: e.target.y(),
                    };
                }
                return shape;
            })
        );
    }, []);

    // --- RENDER ---
    return (
        <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: 'sans-serif' }}>

            {/* 1. Khu vực Toolbar (Trái) */}
            <div style={{
                width: '250px',
                backgroundColor: '#f3f4f6',
                padding: '20px',
                borderRight: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Công cụ vẽ</h2>

                <button
                    onClick={() => setSelectedTool('select')}
                    style={getBtnStyle(selectedTool === 'select')}
                >
                    🖱 Chỉ chọn / Di chuyển
                </button>
                <button
                    onClick={() => setSelectedTool('circle')}
                    style={getBtnStyle(selectedTool === 'circle')}
                >
                    ⭕️ Vẽ Hình Tròn
                </button>
                <button
                    onClick={() => setSelectedTool('rect')}
                    style={getBtnStyle(selectedTool === 'rect')}
                >
                    ⬛️ Vẽ Hình Chữ Nhật
                </button>

                <div style={{ marginTop: 'auto', fontSize: '12px', color: '#6b7280' }}>
                    <p><strong>Hướng dẫn:</strong></p>
                    <p>- Chọn công cụ vẽ.</p>
                    <p>- Click 1 lần lên ảnh để bắt đầu.</p>
                    <p>- Di chuột và click lần 2 để hoàn tất.</p>
                    <p>- Chuyển về "Chỉ chọn" để kéo thả.</p>
                </div>
            </div>

            {/* 2. Khu vực Canvas (Phải) */}
            <div style={{ flex: 1, backgroundColor: '#111827', overflow: 'hidden', position: 'relative' }}>
                {/* Nếu ảnh đang load, hiển thị stage mặc định là 800x600, nếu load xong tự fit size ảnh */}
                <Stage
                    width={bgImage ? bgImage.width : 800}
                    height={bgImage ? bgImage.height : 600}
                    onMouseDown={handleStageMouseDown}
                    onMouseMove={handleStageMouseMove}
                    style={{ cursor: selectedTool === 'select' ? 'default' : 'crosshair' }}
                >
                    <Layer>
                        {/* Background Image */}
                        {bgImage && <KonvaImage image={bgImage} x={0} y={0} />}

                        {/* Render các hình đã vẽ */}
                        {shapes.map((shape) => {
                            const isDraggable = selectedTool === 'select';

                            if (shape.type === 'circle') {
                                return (
                                    <Circle
                                        key={shape.id}
                                        x={shape.x}
                                        y={shape.y}
                                        radius={shape.radius}
                                        stroke="red"
                                        strokeWidth={3}
                                        draggable={isDraggable}
                                        onDragEnd={(e) => handleDragEnd(shape.id, e)}
                                    />
                                );
                            }

                            if (shape.type === 'rect') {
                                return (
                                    <Rect
                                        key={shape.id}
                                        x={shape.x}
                                        y={shape.y}
                                        width={shape.width}
                                        height={shape.height}
                                        stroke="blue"
                                        strokeWidth={3}
                                        draggable={isDraggable}
                                        onDragEnd={(e) => handleDragEnd(shape.id, e)}
                                    />
                                );
                            }
                            return null;
                        })}

                        {/* Render hình Preview (khi đang di chuột giữa click 1 và click 2) */}
                        {isDrawing && startPoint && currentPoint && (
                            <>
                                {selectedTool === 'circle' && (
                                    <Circle
                                        {...getCircleProps(startPoint, currentPoint)}
                                        stroke="red"
                                        strokeWidth={2}
                                        dash={[5, 5]} // Viền đứt nét báo hiệu đang preview
                                        opacity={0.6}
                                    />
                                )}
                                {selectedTool === 'rect' && (
                                    <Rect
                                        {...getRectProps(startPoint, currentPoint)}
                                        stroke="blue"
                                        strokeWidth={2}
                                        dash={[5, 5]}
                                        opacity={0.6}
                                    />
                                )}
                            </>
                        )}
                    </Layer>
                </Stage>
            </div>
        </div>
    );
};

// Helper style cho button
const getBtnStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 15px',
    border: isActive ? '2px solid #3b82f6' : '1px solid #d1d5db',
    backgroundColor: isActive ? '#eff6ff' : '#ffffff',
    color: isActive ? '#1d4ed8' : '#374151',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: isActive ? 'bold' : 'normal',
    textAlign: 'left',
    transition: 'all 0.2s'
});

export default KonvaDemo;