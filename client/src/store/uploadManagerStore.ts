import {makeAutoObservable, observable, runInAction} from 'mobx';
import {v4 as uuidv4} from 'uuid';
import {MediaType} from '../api/api/index.defs';
import type {FolderManifest} from '../utils/folderUploadParser';
import {
    buildUploadQueue,
    createAssetUploadSession,
    createFolderTree,
    type UploadQueueItem,
} from '../service/folderUploadService';
import {uploadService, type UploadProgress} from '../service/uploadService';

export type UploadJobType = 'single' | 'folder';

export type UploadJobStatus =
    | 'DRAFT'
    | 'READY'
    | 'QUEUED'
    | 'RUNNING'
    | 'COMPLETED'
    | 'PARTIAL_FAILED'
    | 'FAILED'
    | 'CANCELLED';

export interface UploadJobContext {
    projectId: string;
    parentFolderId?: string;
    baseFolderPath?: string;
    targetFolderId?: string;
}

export interface UploadJob {
    jobId: string;
    type: UploadJobType;
    status: UploadJobStatus;
    isCreatingTree: boolean;
    context: UploadJobContext;
    manifest?: FolderManifest;
    folderPathToId: Map<string, string>;
    queue: UploadQueueItem[];
    currentIndex: number;
    currentProgress: UploadProgress | null;
    stats: {
        totalBytes: number;
        completedBytes: number;
        uploadedCount: number;
        failedCount: number;
    };
    error: {
        treeError?: string;
        uploadError?: string;
    };
    cancelRequested: boolean;
    file?: File;
}

const inferMediaType = (mimeType: string): MediaType => {
    if (mimeType.startsWith('image/')) return MediaType.IMAGE;
    if (mimeType.startsWith('video/')) return MediaType.VIDEO;
    return MediaType.DESIGN;
};

export class UploadManagerStore {
    jobsById = new Map<string, UploadJob>();
    isWorkerRunning = false;
    activeJobId: string | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    // ── Public API ────────────────────────────────────────────────────────────

    createSingleJob(file: File, context: {projectId: string; folderId: string}): string {
        const jobId = uuidv4();
        const job = observable<UploadJob>({
            jobId,
            type: 'single',
            status: 'READY',
            isCreatingTree: false,
            context: {projectId: context.projectId, targetFolderId: context.folderId},
            folderPathToId: new Map(),
            queue: [],
            currentIndex: -1,
            currentProgress: null,
            stats: {totalBytes: file.size, completedBytes: 0, uploadedCount: 0, failedCount: 0},
            error: {},
            cancelRequested: false,
            file,
        });
        this.jobsById.set(jobId, job);
        return jobId;
    }

    createFolderJob(
        manifest: FolderManifest,
        context: {projectId: string; parentFolderId?: string; baseFolderPath?: string}
    ): string {
        const jobId = uuidv4();
        const job = observable<UploadJob>({
            jobId,
            type: 'folder',
            status: 'DRAFT',
            isCreatingTree: false,
            context: {
                projectId: context.projectId,
                parentFolderId: context.parentFolderId,
                baseFolderPath: context.baseFolderPath,
            },
            manifest,
            folderPathToId: new Map(),
            queue: [],
            currentIndex: -1,
            currentProgress: null,
            stats: {totalBytes: manifest.totalBytes, completedBytes: 0, uploadedCount: 0, failedCount: 0},
            error: {},
            cancelRequested: false,
        });
        this.jobsById.set(jobId, job);
        return jobId;
    }

    async createTree(jobId: string): Promise<void> {
        const job = this.jobsById.get(jobId);
        if (!job || job.type !== 'folder' || !job.manifest || job.status !== 'DRAFT') return;

        runInAction(() => {
            job.isCreatingTree = true;
            job.error.treeError = undefined;
        });

        try {
            const result = await createFolderTree({
                projectId: job.context.projectId,
                parentFolderId: job.context.parentFolderId,
                baseFolderPath: job.context.baseFolderPath,
                rootFolderName: job.manifest.rootFolderName,
                // FolderNode is structurally compatible with FolderTreeNodeDTO
                folderNodes: job.manifest.folderNodes as never,
            });

            runInAction(() => {
                job.folderPathToId = result.folderPathToId;
                job.status = 'READY';
                job.isCreatingTree = false;
            });
        } catch (error) {
            runInAction(() => {
                job.error.treeError = error instanceof Error ? error.message : 'Create folder tree failed';
                job.status = 'FAILED';
                job.isCreatingTree = false;
            });
        }
    }

    start(jobId: string): void {
        const job = this.jobsById.get(jobId);
        if (!job || job.status !== 'READY') return;

        if (this.isWorkerRunning) {
            job.status = 'QUEUED';
            return;
        }

        job.status = 'RUNNING';
        this.isWorkerRunning = true;
        this.activeJobId = jobId;
        this.runWorker().catch(console.error);
    }

    cancel(jobId: string): void {
        const job = this.jobsById.get(jobId);
        if (!job) return;

        if (job.status === 'RUNNING') {
            job.cancelRequested = true;
            uploadService.cancelUpload();
        } else if (job.status === 'QUEUED') {
            job.status = 'CANCELLED';
        }
    }

    // ── Computed helpers (readable from observer components) ──────────────────

    getJob(jobId: string | null): UploadJob | undefined {
        if (!jobId) return undefined;
        return this.jobsById.get(jobId);
    }

    jobOverallPercent(jobId: string): number {
        const job = this.jobsById.get(jobId);
        if (!job || !job.stats.totalBytes) return 0;
        const uploaded = job.stats.completedBytes + (job.currentProgress?.uploadedBytes ?? 0);
        return Math.min(100, Math.round((uploaded / job.stats.totalBytes) * 100));
    }

    jobShowProgress(jobId: string): boolean {
        const job = this.jobsById.get(jobId);
        return !!job && job.status === 'RUNNING' && job.currentIndex >= 0;
    }

    jobCanCreateTree(jobId: string): boolean {
        const job = this.jobsById.get(jobId);
        return !!job && job.type === 'folder' && job.status === 'DRAFT' && !job.isCreatingTree && !!job.manifest;
    }

    jobCanStartUpload(jobId: string): boolean {
        const job = this.jobsById.get(jobId);
        return !!job && job.status === 'READY';
    }

    jobCurrentItem(jobId: string): UploadQueueItem | undefined {
        const job = this.jobsById.get(jobId);
        if (!job || job.currentIndex < 0) return undefined;
        return job.queue[job.currentIndex];
    }

    // ── Sequential worker loop ────────────────────────────────────────────────

    private async runWorker(): Promise<void> {
        try {
            while (true) {
                const job = this.activeJobId ? this.jobsById.get(this.activeJobId) : undefined;
                if (!job || job.status !== 'RUNNING') break;

                if (job.type === 'single') {
                    await this.processSingleJob(job);
                } else {
                    await this.processFolderJob(job);
                }

                // Pick up next queued job, if any
                const nextJob = Array.from(this.jobsById.values()).find(j => j.status === 'QUEUED');
                runInAction(() => {
                    if (nextJob) {
                        nextJob.status = 'RUNNING';
                        this.activeJobId = nextJob.jobId;
                    } else {
                        this.activeJobId = null;
                    }
                });

                if (!this.activeJobId) break;
            }
        } finally {
            runInAction(() => {
                this.isWorkerRunning = false;
                this.activeJobId = null;
            });
        }
    }

    private async processSingleJob(job: UploadJob): Promise<void> {
        if (!job.file ) {
            runInAction(() => {
                job.status = 'FAILED';
                job.error.uploadError = 'Missing file or target folder';
            });
            return;
        }

        const mimeType = job.file.type || 'application/octet-stream';
        const singleItem: UploadQueueItem = {
            file: job.file,
            fileName: job.file.name,
            relativePath: job.file.name,
            folderRelativePath: '',
            depth: 0,
            size: job.file.size,
            mimeType,
            mediaType: inferMediaType(mimeType),
            folderId: job.context.targetFolderId,
            status: 'PENDING',
        };

        runInAction(() => {
            job.queue = [singleItem];
            job.stats.completedBytes = 0;
            job.stats.uploadedCount = 0;
            job.stats.failedCount = 0;
        });

        await this.runUploadLoop(job);
    }

    private async processFolderJob(job: UploadJob): Promise<void> {
        if (!job.manifest || !job.folderPathToId.size) {
            runInAction(() => {
                job.status = 'FAILED';
                job.error.uploadError = 'Folder tree not created — call createTree first';
            });
            return;
        }

        const {queue, errors} = buildUploadQueue(job.manifest.fileItems, job.folderPathToId);

        runInAction(() => {
            if (errors.length) job.error.uploadError = errors[0];
            job.queue = queue;
            job.stats.completedBytes = 0;
            job.stats.uploadedCount = 0;
            job.stats.failedCount = 0;
        });

        if (!queue.length) {
            runInAction(() => {
                job.status = 'FAILED';
                job.error.uploadError = 'No files to upload after queue build';
            });
            return;
        }

        await this.runUploadLoop(job);
    }

    private async runUploadLoop(job: UploadJob): Promise<void> {
        for (let i = 0; i < job.queue.length; i++) {
            if (job.cancelRequested) break;

            runInAction(() => {
                job.currentIndex = i;
                job.currentProgress = null;
                job.queue[i] = {...job.queue[i], status: 'UPLOADING', errorMessage: undefined};
            });

            const item = job.queue[i];

            try {
                const session = await createAssetUploadSession({
                    projectId: job.context.projectId,
                    folderId: item.folderId,
                    fileName: item.fileName,
                    mimeType: item.mimeType,
                    fileSize: item.size,
                    mediaType: item.mediaType,
                });

                runInAction(() => {
                    job.queue[i] = {...job.queue[i], assetId: session.assetId, objectName: session.objectName};
                });

                await uploadService.uploadFileWithSession(
                    item.file,
                    {uploadId: session.uploadId, objectName: session.objectName, partUrls: session.partUrls},
                    (progress) => {
                        runInAction(() => {
                            job.currentProgress = progress;
                        });
                    }
                );

                runInAction(() => {
                    job.queue[i] = {...job.queue[i], status: 'COMPLETED'};
                    job.stats.uploadedCount += 1;
                    job.stats.completedBytes += item.size;
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Upload failed';
                runInAction(() => {
                    job.queue[i] = {
                        ...job.queue[i],
                        status: job.cancelRequested ? 'CANCELLED' : 'FAILED',
                        errorMessage: message,
                    };
                    job.stats.failedCount += 1;
                    job.error.uploadError = message;
                });
            }
        }

        runInAction(() => {
            job.currentProgress = null;
            if (job.cancelRequested) {
                job.status = 'CANCELLED';
            } else if (job.stats.failedCount > 0 && job.stats.uploadedCount === 0) {
                job.status = 'FAILED';
            } else if (job.stats.failedCount > 0) {
                job.status = 'PARTIAL_FAILED';
            } else {
                job.status = 'COMPLETED';
            }
        });
    }
}
