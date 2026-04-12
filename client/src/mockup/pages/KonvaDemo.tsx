import { useState } from "react";
import { Stage, Layer, Image as KonvaImage, Circle, Rect } from "react-konva";
import useImage from "use-image";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Shape, ToolType } from "../types/shapes";

// Import ảnh tĩnh từ src/assets
// Nếu ảnh nằm trong public/, dùng: const IMAGE_URL = "/sample.jpg"
import sampleImage from "../assets/banner.png";

// Kích thước canvas cố định
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

// =================================================================
// SUB-COMPONENT: Render ảnh nền
// =================================================================
// Tách ra component riêng vì useImage phải gọi ở cấp component
function BackgroundImage({ src }: { src: string }) {
    // useImage tự động load ảnh và trả về HTMLImageElement
    const [image, status] = useImage(src);

    // Hiển thị placeholder khi ảnh đang load
    if (status === "loading") {
        return null; // Có thể thêm loading indicator nếu muốn
    }

    return (
        <KonvaImage
            image={image}      // HTMLImageElement
            x={0}              // Góc trái-trên của ảnh
            y={0}
            width={CANVAS_WIDTH}   // Stretch full canvas
            height={CANVAS_HEIGHT}
        />
    );
}

// =================================================================
// COMPONENT CHÍNH
// =================================================================
export default function LocalImageCanvas() {
    const [tool, setTool] = useState<ToolType>("circle");
    const [shapes, setShapes] = useState<Shape[]>([]);

    const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
        // Chỉ vẽ khi click trực tiếp vào Stage hoặc Image
        // (không vẽ khi click vào shape đã có)
        const clickedOnEmpty = e.target === e.target.getStage()
            || e.target.getClassName() === "Image";
        if (!clickedOnEmpty) return;

        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (!pos) return;

        const newShape: Shape = {
            id: Date.now().toString(),
            type: tool,
            x: pos.x,
            y: pos.y,
            fill: tool === "circle"
                ? "rgba(59, 130, 246, 0.6)"   // Màu xanh semi-transparent
                : "rgba(16, 185, 129, 0.6)",  // Màu xanh lá semi-transparent
            stroke: tool === "circle" ? "#1D4ED8" : "#065F46",
        };

        setShapes((prev) => [...prev, newShape]);
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* ===== SIDEBAR TOOLBAR ===== */}
            <aside className="w-48 bg-white shadow-md p-4 flex flex-col gap-3">
                <h2 className="font-bold text-lg text-gray-700 mb-2">
                    Công cụ
                </h2>

                {/* Nút Circle */}
                <button
                    onClick={() => setTool("circle")}
                    className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg font-medium
                        transition-colors duration-200
                        ${tool === "circle"
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-gray-100 text-gray-700 hover:bg-blue-50"
                                }
                        `}
                >
                    <span>⭕</span> Hình tròn
                </button>

                {/* Nút Rectangle */}
                <button
                    onClick={() => setTool("rect")}
                    className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg font-medium
                        transition-colors duration-200
                        ${tool === "rect"
                                    ? "bg-green-600 text-white shadow-md"
                                    : "bg-gray-100 text-gray-700 hover:bg-green-50"
                                }
                      `}
                >
                    <span>🟩</span> Hình vuông
                </button>

                <hr className='my-2' />

                {/* Nút Clear */}
                <button
                    onClick={() => setShapes([])}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg
                        bg-red-50 text-red-600 hover:bg-red-100 font-medium"
                >
                    <span>🗑️</span> Xoá hết
                </button>

                <p className="text-sm text-gray-400 mt-auto">
                    Shapes: {shapes.length}
                </p>
            </aside>

            {/* ===== CANVAS AREA ===== */}
            <main className="flex-1 flex items-center justify-center p-6">
                <Stage
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    onClick={handleStageClick}
                    className="rounded-lg shadow-xl cursor-crosshair"
                >
                    {/* Layer 1: Ảnh nền - chỉ render 1 lần */}
                    <Layer>
                        <BackgroundImage src={sampleImage} />
                    </Layer>

                    {/* Layer 2: Shapes annotation */}
                    <Layer>
                        {shapes.map((shape) =>
                            shape.type === "circle" ? (
                                <Circle
                                    key={shape.id}
                                    x={shape.x}
                                    y={shape.y}
                                    radius={40}
                                    fill={shape.fill}
                                    stroke={shape.stroke}
                                    strokeWidth={2}
                                />
                            ) : (
                                <Rect
                                    key={shape.id}
                                    x={shape.x - 40}
                                    y={shape.y - 30}
                                    width={80}
                                    height={60}
                                    fill={shape.fill}
                                    stroke={shape.stroke}
                                    strokeWidth={2}
                                />
                            )
                        )}
                    </Layer>
                </Stage>
            </main>
        </div>
    );
}
