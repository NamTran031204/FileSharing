import { action, makeObservable, observable, runInAction } from 'mobx';
import type { ImageViewDataDto } from '../../api/api/index.defs';
import { ImageDataControllerService } from '../../api/api/ImageDataControllerService';
import {
  type KonvaShapeData,
  type ScaleFactors,
  annotationRegionToKonva,
} from '../../utils/coordinateTransform';
import type { AnnotationCore } from './ReviewCoreStore';

export interface AnnotationWithShapes extends AnnotationCore {
  konvaShapes: KonvaShapeData[];
}

export class ImagePlayerStore {
  imageData: ImageViewDataDto | null = null;
  isImageLoading: boolean = false;
  imageError: string | null = null;
  scaleFactors: ScaleFactors = { scaleX: 1, scaleY: 1 };

  constructor() {
    makeObservable(this, {
      imageData: observable,
      isImageLoading: observable,
      imageError: observable,
      scaleFactors: observable,
      fetchImageData: action,
      setScaleFactors: action,
      reset: action,
    });
  }

  async fetchImageData(assetId: string): Promise<void> {
    runInAction(() => {
      this.isImageLoading = true;
      this.imageError = null;
    });
    try {
      const response = await ImageDataControllerService.imageData({ assetId });
      if (!response?.isSuccessful) throw new Error(response?.message ?? 'Không tải được ảnh');
      runInAction(() => { this.imageData = response.data ?? null; });
    } catch (err: unknown) {
      runInAction(() => {
        this.imageError = err instanceof Error ? err.message : 'Không tải được ảnh';
      });
    } finally {
      runInAction(() => { this.isImageLoading = false; });
    }
  }

  setScaleFactors(scaleX: number, scaleY: number): void {
    this.scaleFactors = { scaleX, scaleY };
  }

  reset(): void {
    this.imageData = null;
    this.isImageLoading = false;
    this.imageError = null;
    this.scaleFactors = { scaleX: 1, scaleY: 1 };
  }

  /**
   * Converts AnnotationCore[] → AnnotationWithShapes[] using current scaleFactors.
   * Called inside a MobX computed on the wrapper store — MobX tracks scaleFactors access here.
   */
  computeAnnotationsWithShapes(annotations: AnnotationCore[]): AnnotationWithShapes[] {
    const { scaleX, scaleY } = this.scaleFactors;
    return annotations.map(a => ({
      ...a,
      konvaShapes: annotationRegionToKonva(a.region, { scaleX, scaleY }, a.annotationId),
    }));
  }
}
