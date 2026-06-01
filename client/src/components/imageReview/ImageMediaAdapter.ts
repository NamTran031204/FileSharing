import type Konva from 'konva';
import { MediaType } from '../../api/api/index.defs';
import type { ShapeInfo } from '../../api/api/index.defs';
import { buildShapeInfoList, type KonvaShapeData } from '../../utils/coordinateTransform';
import type { ImagePlayerStore } from '../../store/review/ImagePlayerStore';
import type { MediaAdapter } from '../mediaReview/bridge/MediaAdapter';

export class ImageMediaAdapter implements MediaAdapter {
  readonly mediaType = MediaType.IMAGE;

  constructor(
    private readonly player: ImagePlayerStore,
    private readonly stageRef: React.RefObject<Konva.Stage | null>,
    private readonly setHighlighted: (id: string | null) => void,
  ) {}

  focusAnnotation(annotationId: string): void {
    this.setHighlighted(annotationId);
    // Optional: pan canvas to the shape's position using stageRef
    // (pan logic can be added here without changing the sidebar)
  }

  buildRegion(localShapes: KonvaShapeData[]): ShapeInfo[] {
    return buildShapeInfoList(localShapes, this.player.scaleFactors);
  }
}
