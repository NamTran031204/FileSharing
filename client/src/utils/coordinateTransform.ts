import type { ShapeInfo } from '../api/api/index.defs';
import { Shape } from '../api/api/index.defs';

// Matches the Shape union from useKonvaCanvas.ts, extended for future shape types
export interface KonvaShapeData {
  id: string;
  type: 'rect' | 'circle' | 'arrow' | 'text' | 'dot';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  x2?: number;
  y2?: number;
  stroke: string;
  strokeWidth: number;
  rotation?: number;
  // Link back to the saved AnnotationsEntity so canvas shapes can highlight on comment click
  annotationId?: string;
}

// scaleX = previewImageWidth / originalImageWidth
// scaleY = previewImageHeight / originalImageHeight
export interface ScaleFactors {
  scaleX: number;
  scaleY: number;
}

const FRONTEND_TO_BACKEND: Record<KonvaShapeData['type'], Shape> = {
  rect: Shape.RECT,
  circle: Shape.CIRCLE,
  arrow: Shape.ARROW,
  text: Shape.TEXT,
  dot: Shape.DOT,
};

const BACKEND_TO_FRONTEND: Partial<Record<Shape, KonvaShapeData['type']>> = {
  [Shape.RECT]: 'rect',
  [Shape.CIRCLE]: 'circle',
  [Shape.ARROW]: 'arrow',
  [Shape.TEXT]: 'text',
  [Shape.DOT]: 'dot',
};

/**
 * Converts one Konva shape (preview/world coordinates) → ShapeInfo (original image coordinates).
 * Call this before sending to the annotation API.
 *
 * scale.scaleX = previewWidth / originalWidth, so: origCoord = konvaCoord / scaleX
 */
export function konvaToShapeInfo(shape: KonvaShapeData, scale: ScaleFactors): ShapeInfo {
  const { scaleX, scaleY } = scale;

  const base: ShapeInfo = {
    shapeId: shape.id,
    shape: FRONTEND_TO_BACKEND[shape.type] ?? Shape.RECT,
    x: shape.x / scaleX,
    y: shape.y / scaleY,
    stroke: shape.stroke,
    strokeColor: shape.stroke,
    strokeWidth: shape.strokeWidth,
  };

  switch (shape.type) {
    case 'rect':
      return {
        ...base,
        width: (shape.width ?? 0) / scaleX,
        height: (shape.height ?? 0) / scaleY,
      };
    case 'circle':
      // radius uses scaleX assuming square pixels; adjust if aspect ratio differs
      return { ...base, radius: (shape.radius ?? 0) / scaleX };
    case 'arrow':
      return {
        ...base,
        x2: (shape.x2 ?? 0) / scaleX,
        y2: (shape.y2 ?? 0) / scaleY,
      };
    case 'text':
      return {
        ...base,
        width: (shape.width ?? 0) / scaleX,
        height: (shape.height ?? 0) / scaleY,
        fontSize: 14 / scaleX,
      };
    case 'dot':
      return { ...base, radius: (shape.radius ?? 4) / scaleX };
    default:
      return base;
  }
}

/**
 * Converts an array of Konva shapes to ShapeInfo list for the API payload.
 */
export function buildShapeInfoList(shapes: KonvaShapeData[], scale: ScaleFactors): ShapeInfo[] {
  return shapes.map(s => konvaToShapeInfo(s, scale));
}

/**
 * Converts one ShapeInfo (original image coordinates) → KonvaShapeData (preview/world coordinates).
 * Call this when rendering saved annotations onto the canvas.
 *
 * konvaCoord = origCoord * scaleX
 */
export function shapeInfoToKonva(
  info: ShapeInfo,
  scale: ScaleFactors,
  annotationId?: string,
): KonvaShapeData {
  const { scaleX, scaleY } = scale;
  const frontendType: KonvaShapeData['type'] =
    BACKEND_TO_FRONTEND[info.shape as Shape] ?? 'rect';

  const base: KonvaShapeData = {
    id: info.shapeId ?? crypto.randomUUID(),
    type: frontendType,
    x: (info.x ?? 0) * scaleX,
    y: (info.y ?? 0) * scaleY,
    stroke: info.stroke ?? info.strokeColor ?? '#f43f5e',
    strokeWidth: info.strokeWidth ?? 2,
    annotationId,
  };

  switch (frontendType) {
    case 'rect':
      return {
        ...base,
        width: (info.width ?? 0) * scaleX,
        height: (info.height ?? 0) * scaleY,
      };
    case 'circle':
      return { ...base, radius: (info.radius ?? 0) * scaleX };
    case 'arrow':
      return {
        ...base,
        x2: (info.x2 ?? 0) * scaleX,
        y2: (info.y2 ?? 0) * scaleY,
      };
    case 'text':
      return {
        ...base,
        width: (info.width ?? 0) * scaleX,
        height: (info.height ?? 0) * scaleY,
      };
    case 'dot':
      return { ...base, radius: (info.radius ?? 4) * scaleX };
    default:
      return base;
  }
}

/**
 * Converts all ShapeInfo regions of an annotation to Konva shapes for canvas rendering.
 */
export function annotationRegionToKonva(
  region: ShapeInfo[] | null | undefined,
  scale: ScaleFactors,
  annotationId?: string,
): KonvaShapeData[] {
  if (!region || region.length === 0) return [];
  return region.map(s => shapeInfoToKonva(s, scale, annotationId));
}
