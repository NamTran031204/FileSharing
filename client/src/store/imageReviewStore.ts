import { action, computed, makeObservable, observable, runInAction } from 'mobx';
import type {
  AnnotationsEntity,
  AnnotationSummaryResponse,
  ImageViewDataDto,
  AssetDetailResponseDto,
  MetadataEntity,
  ReviewSessionEntity,
} from '../api/api/index.defs';
import {
  AnnotationStatus,
  MediaType,
  ReviewSessionStatus,
} from '../api/api/index.defs';
import { AnnotationsControllerService } from '../api/api/AnnotationsControllerService';
import { ImageDataControllerService } from '../api/api/ImageDataControllerService';
import { AssetControllerService } from '../api/api/AssetControllerService';
import { AssetVersionControllerService } from '../api/api/AssetVersionControllerService';
import { ReviewSessionControllerService } from '../api/api/ReviewSessionControllerService';
import { API_BASE, tokenManager } from '../api/baseApi';
import {
  type KonvaShapeData,
  type ScaleFactors,
  annotationRegionToKonva,
  buildShapeInfoList,
} from '../utils/coordinateTransform';

// ─── Local types ─────────────────────────────────────────────────────────────

export type AnnotationFilter = 'ALL' | 'OPEN' | 'RESOLVED';

export interface AnnotationWithShapes extends AnnotationsEntity {
  konvaShapes: KonvaShapeData[];
  replies: AnnotationsEntity[];
  isRepliesLoaded: boolean;
  authorName?: string;
}

interface AnnotationSseEvent {
  eventType: 'CREATED' | 'UPDATED' | 'RESOLVED' | 'REOPENED' | 'DELETED';
  assetId: string;
  annotationId: string;
  actorId: string;
  authorName?: string;
  annotation: AnnotationsEntity | null;
  replyCount?: number;
  threadRootId?: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

class ImageReviewStore {
  // ── Routing ────────────────────────────────────────────────────────────────
  assetId: string = '';
  currentVersionNumber: number = 1;

  // ── Image data ─────────────────────────────────────────────────────────────
  imageData: ImageViewDataDto | null = null;
  isImageLoading: boolean = false;
  imageError: string | null = null;

  // ── Asset detail ───────────────────────────────────────────────────────────
  assetDetail: AssetDetailResponseDto | null = null;

  // ── Version list ───────────────────────────────────────────────────────────
  versions: MetadataEntity[] = [];
  isVersionsLoading: boolean = false;

  // ── Current version metadata ───────────────────────────────────────────────
  currentVersionMetadata: MetadataEntity | null = null;
  isVersionMetadataLoading: boolean = false;

  // ── Annotations ────────────────────────────────────────────────────────────
  annotations: AnnotationWithShapes[] = [];
  isAnnotationsLoading: boolean = false;
  annotationError: string | null = null;
  isSaving: boolean = false;

  // ── Summary ────────────────────────────────────────────────────────────────
  summary: AnnotationSummaryResponse | null = null;

  // ── Review session ─────────────────────────────────────────────────────────
  reviewSession: ReviewSessionEntity | null = null;
  isReviewLoading: boolean = false;

  // ── UI state ───────────────────────────────────────────────────────────────
  activeFilter: AnnotationFilter = 'ALL';
  expandedThreadIds: Set<string> = new Set();
  highlightedAnnotationId: string | null = null;
  showAnnotations: boolean = true;

  // ── Scale factors (set by component after Konva stage mounts) ──────────────
  scaleFactors: ScaleFactors = { scaleX: 1, scaleY: 1 };

  // ── Pending shapes drawn but not yet saved (awaiting comment text) ──────────
  pendingShapes: KonvaShapeData[] = [];

  // ── Global loading ─────────────────────────────────────────────────────────
  isInitialLoading: boolean = false;

  // ── SSE ────────────────────────────────────────────────────────────────────
  private _sseAbortController: AbortController | null = null;

  constructor() {
    makeObservable(this, {
      assetId: observable,
      currentVersionNumber: observable,
      imageData: observable,
      isImageLoading: observable,
      imageError: observable,
      assetDetail: observable,
      versions: observable,
      isVersionsLoading: observable,
      currentVersionMetadata: observable,
      isVersionMetadataLoading: observable,
      annotations: observable,
      isAnnotationsLoading: observable,
      annotationError: observable,
      isSaving: observable,
      summary: observable,
      reviewSession: observable,
      isReviewLoading: observable,
      activeFilter: observable,
      expandedThreadIds: observable,
      highlightedAnnotationId: observable,
      showAnnotations: observable,
      scaleFactors: observable,
      pendingShapes: observable,
      isInitialLoading: observable,

      filteredAnnotations: computed,
      openCount: computed,
      resolvedCount: computed,
      allKonvaShapes: computed,
      reviewStatus: computed,

      init: action,
      destroy: action,
      setScaleFactors: action,
      setActiveFilter: action,
      toggleAnnotationVisibility: action,
      setPendingShapes: action,
      setHighlightedAnnotation: action,
      toggleThreadExpanded: action,
      switchVersion: action,
      handleSseAnnotationEvent: action,

      fetchImageData: action,
      fetchAssetDetail: action,
      fetchVersionList: action,
      fetchCurrentVersionMetadata: action,
      fetchAnnotations: action,
      fetchAnnotationSummary: action,
      fetchReplies: action,
      fetchReviewSession: action,

      createAnnotation: action,
      addReply: action,
      editAnnotation: action,
      resolveAnnotation: action,
      reopenAnnotation: action,
      deleteAnnotation: action,

      approveReview: action,
      requestChanges: action,
    });
  }

  // ─── Computed ──────────────────────────────────────────────────────────────

  get filteredAnnotations(): AnnotationWithShapes[] {
    if (this.activeFilter === 'ALL') return this.annotations;
    const status =
      this.activeFilter === 'OPEN' ? AnnotationStatus.OPEN : AnnotationStatus.RESOLVED;
    return this.annotations.filter(a => a.status === status);
  }

  get openCount(): number {
    const raw = this.summary?.open;
    return raw !== undefined ? parseInt(raw as unknown as string, 10) || 0
      : this.annotations.filter(a => a.status === AnnotationStatus.OPEN).length;
  }

  get resolvedCount(): number {
    const raw = this.summary?.resolved;
    return raw !== undefined ? parseInt(raw as unknown as string, 10) || 0
      : this.annotations.filter(a => a.status === AnnotationStatus.RESOLVED).length;
  }

  /** All saved annotation shapes for canvas rendering. Empty when showAnnotations is false. */
  get allKonvaShapes(): KonvaShapeData[] {
    if (!this.showAnnotations) return [];
    return this.annotations.flatMap(a => a.konvaShapes);
  }

  /** Maps ReviewSessionStatus → display status string used by the page. */
  get reviewStatus(): 'PENDING' | 'APPROVED' | 'REQUEST_CHANGES' {
    switch (this.reviewSession?.status) {
      case ReviewSessionStatus.APPROVED: return 'APPROVED';
      case ReviewSessionStatus.REQUEST_CHANGES: return 'REQUEST_CHANGES';
      default: return 'PENDING';
    }
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  /** Entry point — call from useEffect on mount. */
  async init(assetId: string, versionNumber?: number): Promise<void> {
    runInAction(() => {
      this.assetId = assetId;
      this.isInitialLoading = true;
      this.annotationError = null;
      this.imageError = null;
    });

    // Phase 1: independent loads in parallel
    await Promise.all([
      this.fetchImageData(assetId),
      this.fetchAssetDetail(assetId),
      this.fetchVersionList(assetId),
    ]);

    // Resolve version number: URL param > assetDetail latest version > default 1
    const resolvedVersion =
      versionNumber ??
      this.assetDetail?.latestVersion?.versionNumber ??
      1;

    runInAction(() => {
      this.currentVersionNumber = resolvedVersion;
      this.isInitialLoading = false;
    });

    // Phase 2: version-dependent loads in parallel
    await Promise.all([
      this.fetchAnnotations(),
      this.fetchAnnotationSummary(),
      this.fetchReviewSession(),
      this.fetchCurrentVersionMetadata(),
    ]);

    // Phase 3: subscribe SSE for realtime annotation updates
    this.subscribeAnnotationSSE();
  }

  /** Call from useEffect cleanup (return) to close SSE and reset state. */
  destroy(): void {
    this.unsubscribeAnnotationSSE();
    this.annotations = [];
    this.imageData = null;
    this.assetDetail = null;
    this.versions = [];
    this.currentVersionMetadata = null;
    this.summary = null;
    this.reviewSession = null;
    this.pendingShapes = [];
    this.assetId = '';
    this.highlightedAnnotationId = null;
    this.expandedThreadIds = new Set();
    this.annotationError = null;
    this.imageError = null;
  }

  // ─── Data Fetching ─────────────────────────────────────────────────────────

  async fetchImageData(assetId: string): Promise<void> {
    runInAction(() => {
      this.isImageLoading = true;
      this.imageError = null;
    });
    try {
      const response = await ImageDataControllerService.imageData({ assetId });
      if (!response?.isSuccessful) throw new Error(response?.message ?? 'Không tải được ảnh');
      runInAction(() => {
        this.imageData = response.data ?? null;
      });
    } catch (err: unknown) {
      runInAction(() => {
        this.imageError = err instanceof Error ? err.message : 'Không tải được ảnh';
      });
    } finally {
      runInAction(() => {
        this.isImageLoading = false;
      });
    }
  }

  async fetchAssetDetail(assetId: string): Promise<void> {
    try {
      const response = await AssetControllerService.getById({ assetId });
      if (response?.isSuccessful) {
        runInAction(() => {
          this.assetDetail = response.data ?? null;
        });
      }
    } catch { /* non-blocking — page still works without metadata */ }
  }

  async fetchVersionList(assetId: string): Promise<void> {
    runInAction(() => { this.isVersionsLoading = true; });
    try {
      const response = await AssetVersionControllerService.getPage({
        body: {
          maxResultCount: 50,
          skipCount: 0,
          sorting: 'versionNumber,desc',
          filter: { assetId },
        },
      });
      if (response?.isSuccessful) {
        runInAction(() => {
          this.versions = response.data?.data ?? [];
        });
      }
    } catch { /* non-blocking */ }
    finally {
      runInAction(() => { this.isVersionsLoading = false; });
    }
  }

  async fetchCurrentVersionMetadata(): Promise<void> {
    runInAction(() => { this.isVersionMetadataLoading = true; });
    try {
      const response = await AssetVersionControllerService.version({
        assetId: this.assetId,
        versionNumber: this.currentVersionNumber,
      });
      if (response?.isSuccessful) {
        runInAction(() => { this.currentVersionMetadata = response.data ?? null; });
      }
    } catch { /* non-blocking */ }
    finally {
      runInAction(() => { this.isVersionMetadataLoading = false; });
    }
  }

  async fetchAnnotations(): Promise<void> {
    runInAction(() => {
      this.isAnnotationsLoading = true;
      this.annotationError = null;
    });
    try {
      const response = await AnnotationsControllerService.listRootCommentByAsset({
        assetId: this.assetId,
        versionNumber: this.currentVersionNumber,
      });
      if (!response?.isSuccessful) throw new Error(response?.message ?? 'Lỗi tải annotations');
      const items = response.data ?? [];
      runInAction(() => {
        this.annotations = items.map(a => this._wrapAnnotation(a));
      });
    } catch (err: unknown) {
      runInAction(() => {
        this.annotationError = err instanceof Error ? err.message : 'Lỗi tải annotations';
      });
    } finally {
      runInAction(() => { this.isAnnotationsLoading = false; });
    }
  }

  async fetchAnnotationSummary(): Promise<void> {
    try {
      const response = await AnnotationsControllerService.summary({
        assetId: this.assetId,
        versionNumber: this.currentVersionNumber,
      });
      if (response?.isSuccessful) {
        runInAction(() => { this.summary = response.data ?? null; });
      }
    } catch { /* non-blocking */ }
  }

  async fetchReplies(annotationId: string): Promise<void> {
    try {
      const response = await AnnotationsControllerService.listReplies({
        threadRootId: annotationId,
      });
      if (!response?.isSuccessful) return;
      const replies = response.data ?? [];
      runInAction(() => {
        const annotation = this.annotations.find(a => a.annotationId === annotationId);
        if (annotation) {
          annotation.replies = replies;
          annotation.isRepliesLoaded = true;
        }
      });
    } catch { /* non-blocking */ }
  }

  async fetchReviewSession(): Promise<void> {
    try {
      const response = await ReviewSessionControllerService.asset({
        assetId: this.assetId,
        versionNumber: this.currentVersionNumber,
      });
      if (response?.isSuccessful) {
        const sessions = response.data ?? [];
        // Use the most recent active session
        const active = sessions.find(s => s.isActive) ?? sessions[0] ?? null;
        runInAction(() => { this.reviewSession = active; });
      }
    } catch { /* non-blocking */ }
  }

  // ─── Annotation CRUD ───────────────────────────────────────────────────────

  /** Creates a root-level annotation (shape + comment). Returns the saved entity or null on error. */
  async createAnnotation(
    commentText: string,
    shapes: KonvaShapeData[],
  ): Promise<AnnotationsEntity | null> {
    runInAction(() => { this.isSaving = true; });
    try {
      const region = buildShapeInfoList(shapes, this.scaleFactors);
      const response = await AnnotationsControllerService.create({
        body: {
          assetId: this.assetId,
          versionNumber: this.currentVersionNumber,
          commentBody: { body: commentText, userMentions: [] },
          mediaType: MediaType.IMAGE,
          region,
          timeCode: undefined,
          frameNumber: undefined,
          parentCommentId: undefined,
        },
      });
      if (!response?.isSuccessful) throw new Error(response?.message ?? 'Lưu annotation thất bại');
      const created = response.data!;
      runInAction(() => {
        const alreadyExists = this.annotations.some(
          a => a.annotationId === created.annotationId,
        );
        if (!alreadyExists) {
          this.annotations.push(this._wrapAnnotation(created));
        }
        this.pendingShapes = [];
      });
      this.fetchAnnotationSummary();
      return created;
    } catch (err: unknown) {
      runInAction(() => {
        this.annotationError = err instanceof Error ? err.message : 'Lưu annotation thất bại';
      });
      return null;
    } finally {
      runInAction(() => { this.isSaving = false; });
    }
  }

  /** Adds a reply to an existing thread. */
  async addReply(threadRootId: string, commentText: string): Promise<AnnotationsEntity | null> {
    runInAction(() => { this.isSaving = true; });
    try {
      const response = await AnnotationsControllerService.create({
        body: {
          assetId: this.assetId,
          versionNumber: this.currentVersionNumber,
          commentBody: { body: commentText, userMentions: [] },
          mediaType: MediaType.IMAGE,
          region: [],
          timeCode: undefined,
          frameNumber: undefined,
          parentCommentId: threadRootId,
        },
      });
      if (!response?.isSuccessful) throw new Error(response?.message ?? 'Gửi reply thất bại');
      const reply = response.data!;
      runInAction(() => {
        const root = this.annotations.find(a => a.annotationId === threadRootId);
        if (root) {
          const replyExists = root.replies.some(r => r.annotationId === reply.annotationId);
          if (!replyExists) {
            root.replies = [...root.replies, reply];
          }
          root.isRepliesLoaded = true;
        }
      });
      return reply;
    } catch (err: unknown) {
      runInAction(() => {
        this.annotationError = err instanceof Error ? err.message : 'Gửi reply thất bại';
      });
      return null;
    } finally {
      runInAction(() => { this.isSaving = false; });
    }
  }

  async editAnnotation(annotationId: string, newText: string): Promise<void> {
    try {
      const response = await AnnotationsControllerService.edit({
        body: {
          annotationId,
          commentBody: { body: newText, userMentions: [] },
          region: [],
        },
      });
      if (!response?.isSuccessful) throw new Error(response?.message ?? 'Chỉnh sửa thất bại');
      const updated = response.data!;
      runInAction(() => {
        const idx = this.annotations.findIndex(a => a.annotationId === annotationId);
        if (idx !== -1) {
          // Preserve konvaShapes and replies from existing entry
          const prev = this.annotations[idx];
          this.annotations[idx] = {
            ...prev,
            ...updated,
            konvaShapes: prev.konvaShapes,
            replies: prev.replies,
            isRepliesLoaded: prev.isRepliesLoaded,
          };
        } else {
          // It's a reply — find and update inside replies list
          for (const ann of this.annotations) {
            const rIdx = ann.replies.findIndex(r => r.annotationId === annotationId);
            if (rIdx !== -1) {
              ann.replies = [
                ...ann.replies.slice(0, rIdx),
                updated,
                ...ann.replies.slice(rIdx + 1),
              ];
              break;
            }
          }
        }
      });
    } catch (err: unknown) {
      runInAction(() => {
        this.annotationError = err instanceof Error ? err.message : 'Chỉnh sửa thất bại';
      });
    }
  }

  async resolveAnnotation(annotationId: string): Promise<void> {
    try {
      const response = await AnnotationsControllerService.resolve({
        body: { annotationId },
      });
      if (!response?.isSuccessful) throw new Error(response?.message ?? 'Resolve thất bại');
      const updated = response.data!;
      runInAction(() => {
        const idx = this.annotations.findIndex(a => a.annotationId === annotationId);
        if (idx !== -1) {
          this.annotations[idx] = { ...this.annotations[idx], ...updated };
        }
      });
      this.fetchAnnotationSummary();
    } catch (err: unknown) {
      runInAction(() => {
        this.annotationError = err instanceof Error ? err.message : 'Resolve thất bại';
      });
    }
  }

  async reopenAnnotation(annotationId: string): Promise<void> {
    try {
      const response = await AnnotationsControllerService.reopen({
        body: { annotationId },
      });
      if (!response?.isSuccessful) throw new Error(response?.message ?? 'Reopen thất bại');
      const updated = response.data!;
      runInAction(() => {
        const idx = this.annotations.findIndex(a => a.annotationId === annotationId);
        if (idx !== -1) {
          this.annotations[idx] = { ...this.annotations[idx], ...updated };
        }
      });
      this.fetchAnnotationSummary();
    } catch (err: unknown) {
      runInAction(() => {
        this.annotationError = err instanceof Error ? err.message : 'Reopen thất bại';
      });
    }
  }

  async deleteAnnotation(annotationId: string): Promise<void> {
    try {
      const response = await AnnotationsControllerService.delete({
        body: { annotationId },
      });
      if (!response?.isSuccessful) throw new Error(response?.message ?? 'Xóa thất bại');
      const wasRoot = this.annotations.some(a => a.annotationId === annotationId);
      runInAction(() => {
        if (wasRoot) {
          this.annotations = this.annotations.filter(a => a.annotationId !== annotationId);
        } else {
          for (const ann of this.annotations) {
            const before = ann.replies.length;
            ann.replies = ann.replies.filter(r => r.annotationId !== annotationId);
            if (ann.replies.length !== before) break;
          }
        }
      });
      if (wasRoot) this.fetchAnnotationSummary();
    } catch (err: unknown) {
      runInAction(() => {
        this.annotationError = err instanceof Error ? err.message : 'Xóa thất bại';
      });
    }
  }

  // ─── Review Session ────────────────────────────────────────────────────────

  async approveReview(): Promise<void> {
    if (!this.reviewSession?.reviewSessionId) return;
    runInAction(() => { this.isReviewLoading = true; });
    try {
      const response = await ReviewSessionControllerService.decision({
        reviewSessionId: this.reviewSession.reviewSessionId,
        body: { decision: ReviewSessionStatus.APPROVED },
      });
      if (!response?.isSuccessful) throw new Error(response?.message ?? 'Approve thất bại');
      runInAction(() => { this.reviewSession = response.data ?? this.reviewSession; });
    } catch (err: unknown) {
      runInAction(() => {
        this.annotationError = err instanceof Error ? err.message : 'Approve thất bại';
      });
    } finally {
      runInAction(() => { this.isReviewLoading = false; });
    }
  }

  async requestChanges(note?: string): Promise<void> {
    if (!this.reviewSession?.reviewSessionId) return;
    runInAction(() => { this.isReviewLoading = true; });
    try {
      const response = await ReviewSessionControllerService.decision({
        reviewSessionId: this.reviewSession.reviewSessionId,
        body: { decision: ReviewSessionStatus.REQUEST_CHANGES, note },
      });
      if (!response?.isSuccessful) throw new Error(response?.message ?? 'Request changes thất bại');
      runInAction(() => { this.reviewSession = response.data ?? this.reviewSession; });
    } catch (err: unknown) {
      runInAction(() => {
        this.annotationError = err instanceof Error ? err.message : 'Request changes thất bại';
      });
    } finally {
      runInAction(() => { this.isReviewLoading = false; });
    }
  }

  // ─── Version switching ─────────────────────────────────────────────────────

  async switchVersion(versionNumber: number): Promise<void> {
    runInAction(() => {
      this.currentVersionNumber = versionNumber;
      this.annotations = [];
      this.summary = null;
      this.reviewSession = null;
      this.currentVersionMetadata = null;
      this.highlightedAnnotationId = null;
      this.expandedThreadIds = new Set();
    });
    await Promise.all([
      this.fetchAnnotations(),
      this.fetchAnnotationSummary(),
      this.fetchReviewSession(),
      this.fetchCurrentVersionMetadata(),
    ]);
  }

  // ─── UI actions ────────────────────────────────────────────────────────────

  /**
   * Update scale factors after the Konva Stage reports its actual dimensions.
   * Also recalculates konvaShapes for all loaded annotations.
   *
   * @param scaleX  previewImageWidth / originalImageWidth
   * @param scaleY  previewImageHeight / originalImageHeight
   */
  setScaleFactors(scaleX: number, scaleY: number): void {
    this.scaleFactors = { scaleX, scaleY };
    this.annotations = this.annotations.map(a => ({
      ...a,
      konvaShapes: annotationRegionToKonva(a.region, { scaleX, scaleY }, a.annotationId),
    }));
  }

  setActiveFilter(filter: AnnotationFilter): void {
    this.activeFilter = filter;
  }

  toggleAnnotationVisibility(): void {
    this.showAnnotations = !this.showAnnotations;
  }

  setPendingShapes(shapes: KonvaShapeData[]): void {
    this.pendingShapes = shapes;
  }

  setHighlightedAnnotation(annotationId: string | null): void {
    this.highlightedAnnotationId = annotationId;
  }

  toggleThreadExpanded(annotationId: string): void {
    if (this.expandedThreadIds.has(annotationId)) {
      this.expandedThreadIds.delete(annotationId);
    } else {
      this.expandedThreadIds.add(annotationId);
      const annotation = this.annotations.find(a => a.annotationId === annotationId);
      if (annotation && !annotation.isRepliesLoaded) {
        this.fetchReplies(annotationId);
      }
    }
  }

  clearAnnotationError(): void {
    this.annotationError = null;
  }

  // ─── SSE ───────────────────────────────────────────────────────────────────

  /** Subscribe to realtime annotation events for the current asset.
   *  Uses fetch + AbortController (EventSource does not support Authorization headers).
   *  Implements SSE spec-compliant multi-line data parsing and exponential-backoff reconnect.
   */
  subscribeAnnotationSSE(): void {
    this.unsubscribeAnnotationSSE();

    const token = tokenManager.getAccessToken();
    const url = `${API_BASE}/annotation/subscribe/${this.assetId}`;
    const controller = new AbortController();
    this._sseAbortController = controller;

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let retryDelay = 1000;

    const connect = async (): Promise<void> => {
      try {
        console.log('[SSE] Connecting:', url);
        const response = await fetch(url, { headers, signal: controller.signal });

        if (!response.ok || !response.body) {
          console.warn('[SSE] Bad response status:', response.status);
          throw new Error(`HTTP ${response.status}`);
        }

        retryDelay = 1000;
        console.log('[SSE] Connected for assetId:', this.assetId);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let lineBuffer = '';
        // Accumulates data: lines within one SSE event block (SSE spec §9.2.6)
        let dataLines: string[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done || controller.signal.aborted) {
            console.log('[SSE] Stream ended, done=', done);
            break;
          }

          lineBuffer += decoder.decode(value, { stream: true });
          // Handle both \n and \r\n line endings
          const parts = lineBuffer.split(/\r?\n/);
          lineBuffer = parts.pop() ?? '';

          for (const line of parts) {
            if (line.startsWith('data:')) {
              // Strip exactly one leading space per SSE spec, then accumulate
              dataLines.push(line.slice(5).replace(/^ /, ''));
            } else if (line === '' || line === '\r') {
              // Blank line = end of event block → dispatch
              if (dataLines.length > 0) {
                const json = dataLines.join('\n');
                dataLines = [];
                try {
                  const event = JSON.parse(json) as AnnotationSseEvent;
                  console.log('[SSE] Event received:', event.eventType, event.annotationId);
                  runInAction(() => this.handleSseAnnotationEvent(event));
                } catch {
                  console.warn('[SSE] Parse error, raw:', json.slice(0, 300));
                }
              }
            }
            // Skip event:, id:, retry: lines
          }
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        console.warn('[SSE] Connection error, reconnecting in', retryDelay, 'ms:', err);
      }

      if (!controller.signal.aborted) {
        await new Promise<void>(resolve => setTimeout(resolve, retryDelay));
        retryDelay = Math.min(retryDelay * 2, 30_000);
        void connect();
      }
    };

    void connect();
  }

  unsubscribeAnnotationSSE(): void {
    if (this._sseAbortController) {
      this._sseAbortController.abort();
      this._sseAbortController = null;
    }
  }

  handleSseAnnotationEvent(event: AnnotationSseEvent): void {
    const {
      eventType,
      annotationId,
      annotation,
      authorName: eventAuthorName,
      replyCount: eventReplyCount,
      threadRootId: eventThreadRootId,
    } = event;

    switch (eventType) {
      case 'CREATED': {
        if (!annotation) break;
        if (annotation.parentCommentId) {
          const threadRootId = annotation.threadRootId ?? annotation.parentCommentId;
          const root = this.annotations.find(a => a.annotationId === threadRootId);
          if (root) {
            const replyExists = root.replies.some(r => r.annotationId === annotationId);
            if (!replyExists && root.isRepliesLoaded) {
              root.replies = [...root.replies, annotation];
            }
            if (eventReplyCount != null) {
              root.replyCount = eventReplyCount;
            }
          }
        } else {
          // Root comment — only accept events matching the currently viewed version
          if (annotation.versionNumber !== this.currentVersionNumber) break;
          const exists = this.annotations.some(a => a.annotationId === annotationId);
          if (!exists) {
            this.annotations.push(this._wrapAnnotation(annotation, eventAuthorName));
            this.fetchAnnotationSummary();
          }
        }
        break;
      }
      case 'UPDATED': {
        if (!annotation) break;
        const idx = this.annotations.findIndex(a => a.annotationId === annotationId);
        if (idx !== -1) {
          const prev = this.annotations[idx];
          this.annotations[idx] = {
            ...prev,
            ...annotation,
            konvaShapes: annotationRegionToKonva(
              annotation.region,
              this.scaleFactors,
              annotationId,
            ),
          };
        } else {
          for (const ann of this.annotations) {
            const rIdx = ann.replies.findIndex(r => r.annotationId === annotationId);
            if (rIdx !== -1) {
              ann.replies = [
                ...ann.replies.slice(0, rIdx),
                annotation,
                ...ann.replies.slice(rIdx + 1),
              ];
              break;
            }
          }
        }
        break;
      }
      case 'RESOLVED':
      case 'REOPENED': {
        if (!annotation) break;
        const idx = this.annotations.findIndex(a => a.annotationId === annotationId);
        if (idx !== -1) {
          this.annotations[idx] = {
            ...this.annotations[idx],
            status: annotation.status,
            resolvedAt: annotation.resolvedAt,
            resolvedBy: annotation.resolvedBy,
          };
        }
        this.fetchAnnotationSummary();
        break;
      }
      case 'DELETED': {
        const isRoot = this.annotations.some(a => a.annotationId === annotationId);
        if (isRoot) {
          this.annotations = this.annotations.filter(a => a.annotationId !== annotationId);
          this.fetchAnnotationSummary();
        } else {
          for (const ann of this.annotations) {
            const before = ann.replies.length;
            ann.replies = ann.replies.filter(r => r.annotationId !== annotationId);
            if (ann.replies.length !== before) break;
          }
          if (eventThreadRootId && eventReplyCount != null) {
            const root = this.annotations.find(a => a.annotationId === eventThreadRootId);
            if (root) root.replyCount = eventReplyCount;
          }
        }
        break;
      }
    }
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private _wrapAnnotation(a: AnnotationsEntity, authorName?: string): AnnotationWithShapes {
    return {
      ...a,
      authorName: authorName ?? a.authorName,
      konvaShapes: annotationRegionToKonva(a.region, this.scaleFactors, a.annotationId),
      replies: [],
      isRepliesLoaded: false,
    };
  }
}

export default ImageReviewStore;
