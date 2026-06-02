export interface VideoAnnotation {
  id: string;
  type: 'rect' | 'circle';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  rotation: number;
  stroke: string;
  strokeWidth: number;
  startMs: number;
  endMs: number;
}

export type AnnotateMode = 'view' | 'draw-rect' | 'draw-circle' | 'select';
