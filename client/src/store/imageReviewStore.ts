import { computed, makeObservable } from 'mobx';
import { MediaType } from '../api/api/index.defs';
import type { AnnotationsEntity } from '../api/api/index.defs';
import { buildShapeInfoList, type KonvaShapeData } from '../utils/coordinateTransform';
import { ReviewCoreStore } from './review/ReviewCoreStore';
import { ImagePlayerStore } from './review/ImagePlayerStore';
import type { AnnotationWithShapes } from './review/ImagePlayerStore';

// Re-export types consumed by the page so it doesn't need to change imports
export type { AnnotationFilter } from './review/ReviewCoreStore';
export type { AnnotationWithShapes } from './review/ImagePlayerStore';

/**
 * Composition wrapper that presents the same public API as the original monolithic store.
 * Delegates generic review logic to ReviewCoreStore and image-specific logic to ImagePlayerStore.
 * ImageReviewPage continues to use this as before; later phases will access core/player directly.
 */
class ImageReviewStore {
  readonly core: ReviewCoreStore;
  readonly player: ImagePlayerStore;

  constructor() {
    this.core = new ReviewCoreStore(MediaType.IMAGE);
    this.player = new ImagePlayerStore();
    makeObservable(this, {
      allKonvaShapes: computed,
      annotations: computed,
      filteredAnnotations: computed,
    });
  }

  // ─── Cross-slice computeds ─────────────────────────────────────────────────

  /** All saved annotation shapes for canvas rendering. MobX tracks core.annotations + player.scaleFactors. */
  get allKonvaShapes(): KonvaShapeData[] {
    if (!this.core.showAnnotations) return [];
    return this.player
      .computeAnnotationsWithShapes(this.core.annotations)
      .flatMap(a => a.konvaShapes);
  }

  /** Annotations with konvaShapes attached — backward compat for ImageReviewPage. */
  get annotations(): AnnotationWithShapes[] {
    return this.player.computeAnnotationsWithShapes(this.core.annotations);
  }

  /** Filtered annotations with konvaShapes — backward compat. */
  get filteredAnnotations(): AnnotationWithShapes[] {
    return this.player.computeAnnotationsWithShapes(this.core.filteredAnnotations);
  }

  // ─── Proxy getters — MobX tracks underlying observables directly ────────────

  get assetId() { return this.core.assetId; }
  get currentVersionNumber() { return this.core.currentVersionNumber; }
  get imageData() { return this.player.imageData; }
  get isImageLoading() { return this.player.isImageLoading; }
  get imageError() { return this.player.imageError; }
  get assetDetail() { return this.core.assetDetail; }
  get versions() { return this.core.versions; }
  get isVersionsLoading() { return this.core.isVersionsLoading; }
  get currentVersionMetadata() { return this.core.currentVersionMetadata; }
  get isVersionMetadataLoading() { return this.core.isVersionMetadataLoading; }
  get isAnnotationsLoading() { return this.core.isAnnotationsLoading; }
  get annotationError() { return this.core.annotationError; }
  get isSaving() { return this.core.isSaving; }
  get summary() { return this.core.summary; }
  get reviewSession() { return this.core.reviewSession; }
  get isReviewLoading() { return this.core.isReviewLoading; }
  get activeFilter() { return this.core.activeFilter; }
  get expandedThreadIds() { return this.core.expandedThreadIds; }
  get highlightedAnnotationId() { return this.core.highlightedAnnotationId; }
  get showAnnotations() { return this.core.showAnnotations; }
  get scaleFactors() { return this.player.scaleFactors; }
  get isInitialLoading() { return this.core.isInitialLoading; }
  get openCount() { return this.core.openCount; }
  get resolvedCount() { return this.core.resolvedCount; }
  get reviewStatus() { return this.core.reviewStatus; }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  async init(assetId: string, versionNumber?: number): Promise<void> {
    // Run both in parallel: core handles generic data, player handles image data
    await Promise.all([
      this.core.init(assetId, versionNumber),
      this.player.fetchImageData(assetId),
    ]);
  }

  destroy(): void {
    this.core.destroy();
    this.player.reset();
  }

  // ─── Proxy actions — delegate to sub-stores ────────────────────────────────

  /** Backward compat: still accepts KonvaShapeData[], converts to ShapeInfo[] internally. */
  async createAnnotation(
    commentText: string,
    shapes: KonvaShapeData[],
  ): Promise<AnnotationsEntity | null> {
    const region = buildShapeInfoList(shapes, this.player.scaleFactors);
    return this.core.createAnnotation(commentText, region);
  }

  async addReply(threadRootId: string, commentText: string) {
    return this.core.addReply(threadRootId, commentText);
  }

  async editAnnotation(annotationId: string, newText: string) {
    return this.core.editAnnotation(annotationId, newText);
  }

  async resolveAnnotation(annotationId: string) {
    return this.core.resolveAnnotation(annotationId);
  }

  async reopenAnnotation(annotationId: string) {
    return this.core.reopenAnnotation(annotationId);
  }

  async deleteAnnotation(annotationId: string) {
    return this.core.deleteAnnotation(annotationId);
  }

  async approveReview() { return this.core.approveReview(); }
  async requestChanges(note?: string) { return this.core.requestChanges(note); }

  async switchVersion(versionNumber: number) {
    return this.core.switchVersion(versionNumber);
  }

  setScaleFactors(scaleX: number, scaleY: number): void {
    this.player.setScaleFactors(scaleX, scaleY);
    // allKonvaShapes computed auto-invalidates when player.scaleFactors changes
  }

  setActiveFilter(filter: Parameters<ReviewCoreStore['setActiveFilter']>[0]) {
    this.core.setActiveFilter(filter);
  }

  toggleAnnotationVisibility() { this.core.toggleAnnotationVisibility(); }
  setHighlightedAnnotation(id: string | null) { this.core.setHighlightedAnnotation(id); }
  toggleThreadExpanded(id: string) { this.core.toggleThreadExpanded(id); }
  clearAnnotationError() { this.core.clearAnnotationError(); }

  // pendingShapes was unused in the original store, kept as no-op for compat
  setPendingShapes(_shapes: KonvaShapeData[]) { /* no-op */ }
}

export default ImageReviewStore;
