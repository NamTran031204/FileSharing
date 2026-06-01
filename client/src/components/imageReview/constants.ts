export const DEFAULT_STROKE_SIZE = 4;
export const STROKE_COLORS = ['#f43f5e', '#10b981', '#f59e0b', '#0ea5e9', '#535297'] as const;
export type StrokeColor = (typeof STROKE_COLORS)[number];
