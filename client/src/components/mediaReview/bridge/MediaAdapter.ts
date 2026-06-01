import type { ShapeInfo } from '../../../api/api/index.defs';
import type { MediaType } from '../../../api/api/index.defs';
import type { KonvaShapeData } from '../../../utils/coordinateTransform';

export interface MediaAdapter {
  readonly mediaType: MediaType;
  /** Called when user clicks an annotation in sidebar — media should highlight/seek */
  focusAnnotation(annotationId: string): void;
  /** Convert local drawn shapes to server ShapeInfo format */
  buildRegion(localShapes: KonvaShapeData[]): ShapeInfo[];
}
