
export type ToolType = "circle" | "rect";

// Interface dùng chung cho cả hình tròn và hình vuông
export interface Shape {
    id: string;        // ID duy nhất (dùng Date.now().toString())
    type: ToolType;    // Loại hình
    x: number;         // Toạ độ X (tính từ góc trái)
    y: number;         // Toạ độ Y (tính từ góc trên)
    fill: string;      // Màu nền (hex, rgb, ...)
    stroke: string;    // Màu viền
}