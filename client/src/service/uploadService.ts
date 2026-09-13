import SparkMD5 from 'spark-md5';
import type {PartUpload} from '../api/fileApi/fileApiResource';
import fileApiResource, {extractApiError, UploadErrorCode} from '../api/fileApi/fileApiResource';
import type {ReceivedPartDto, UploadResourceResponseDto} from '../api/api/index.defs';
import {AdaptiveBandwidthManager} from '../utils/adaptiveBandwidth';
import {PartUrlManager} from './partUrlManager';
import {clearSessionSnapshot, type AssetUploadSession} from './folderUploadService';
import {v4 as uuidv4} from 'uuid';

// Constants
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;             // 1 second base delay
const MIN_MULTIPART_FILE_SIZE = 5 * 1024 * 1024;

export interface UploadProgress {
    uploadedBytes: number;
    totalBytes: number;
    percentage: number;
    currentChunk: number;
    totalChunks: number;
    throughputMbps: number;
    estimatedTimeRemainingMs: number;
    currentChunkSize: number;
    networkStability: 'stable' | 'unstable' | 'unknown';
    activeThreads: number;
    maxThreads: number;
}

interface CompletedPart {
    partNumber: number;
    etag: string;
    md5: string;
}

// Cac field kieu "long" o backend (partSize/size/uploadedBytes) duoc swagger-axios-codegen khai la
// string de tranh mat chinh xac int64, nhung server thuc te tra ve JSON number - chap nhan ca hai.
const toNumber = (value: unknown): number => {
    if (typeof value === 'number') return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const hexToBase64 = (hex: string): string => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
};

// "Missing parts: [37, 38, 91]" / "Checksum mismatch at parts: [12, 44]" -> [37, 38, 91]
const parsePartListFromMessage = (message: string): number[] => {
    const match = message.match(/\[([\d,\s]+)]/);
    if (!match) return [];
    return match[1]
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => Number.isFinite(n));
};

class Semaphore {
    private permits: number;
    private maxPermits: number;
    private waitingQueue: Array<() => void> = [];

    constructor(initialPermits: number) {
        this.permits = initialPermits;
        this.maxPermits = initialPermits;
    }

    /**
     * lay mot permit, cho neu khong co permit available
     */
    async acquire(): Promise<void> {
        if (this.permits > 0) {
            this.permits--;
            return Promise.resolve();
        }

        // khong co permit, phai cho
        return new Promise<void>((resolve) => {
            this.waitingQueue.push(resolve);
        });
    }

    /**
     * release mot permit, cho phep mot waiter tiep tuc
     */
    release(): void {
        if (this.waitingQueue.length > 0) {
            const next = this.waitingQueue.shift();
            if (next) {
                next();
            }
        } else {
            this.permits = Math.min(this.permits + 1, this.maxPermits);
        }
    }

    /**
     * cap nhat so luong permits toi da (cho adaptive threading)
     */
    updateMaxPermits(newMax: number): void {
        const diff = newMax - this.maxPermits;
        this.maxPermits = newMax;

        if (diff > 0) {
            // tang permits - them permits moi
            this.permits += diff;
            // release cac waiters neu co permits moi
            while (this.permits > 0 && this.waitingQueue.length > 0) {
                this.permits--;
                const next = this.waitingQueue.shift();
                if (next) next();
            }
        }
        // neu giam permits, cac permits dang chay se tu nhien khong duoc renew
    }

    getActivePermits(): number {
        return this.maxPermits - this.permits;
    }

    getMaxPermits(): number {
        return this.maxPermits;
    }
}

export class UploadService {
    private abortController: AbortController | null = null;
    private uploadedBytes: number = 0;
    private bandwidthManager: AdaptiveBandwidthManager;

    private semaphore: Semaphore | null = null;
    private completedParts: CompletedPart[] = [];
    private uploadPromises: Promise<void>[] = [];
    private totalChunksCreated: number = 0;
    private userCancelled: boolean = false;

    // ===== State rieng cho duong legacy (uploadFile) - khong doi trong WP5, chuyen o T-7.7 =====
    private legacyPartUrls: Map<number, string> = new Map();
    private legacyCompletedParts: PartUpload[] = [];

    constructor() {
        this.bandwidthManager = new AdaptiveBandwidthManager();
    }

    // tinh md5 hash (hex) cua mot chunk
    private async calculateChunkMD5(chunk: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const spark = new SparkMD5.ArrayBuffer();
            const fileReader = new FileReader();

            fileReader.onload = (e) => {
                if (!e.target?.result) {
                    reject(new Error('Failed to read chunk'));
                    return;
                }
                spark.append(e.target.result as ArrayBuffer);
                resolve(spark.end());
            };

            fileReader.onerror = () => {
                reject(new Error('Failed to calculate chunk MD5'));
            };

            fileReader.readAsArrayBuffer(chunk);
        });
    }

    // so sanh etag voi md5 hash
    private compareETagWithMD5(etag: string, md5: string): boolean {
        const cleanETag = etag.replace(/"/g, '').toLowerCase();
        const cleanMD5 = md5.toLowerCase();
        return cleanETag === cleanMD5;
    }

    // ham sleep
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    }

    // ============================================================================================
    // Duong legacy (E7, client tu sinh objectName) - GIU NGUYEN trong WP5, chuyen o T-7.7
    // ============================================================================================

    private async uploadChunkWithRetry(
        presignedUrl: string,
        chunk: Blob,
        partNumber: number,
        onChunkProgress?: (loaded: number, total: number) => void
    ): Promise<{ etag: string; uploadTimeMs: number }> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const startTime = performance.now();

                const etag = await fileApiResource.uploadChunk(
                    presignedUrl,
                    chunk,
                    this.abortController?.signal,
                    onChunkProgress
                );

                const uploadTimeMs = performance.now() - startTime;

                return {etag, uploadTimeMs};
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                if (lastError.name === 'AbortError' || lastError.name === 'CanceledError') {
                    throw lastError;
                }

                console.warn(`chunk ${partNumber} upload lan thu ${attempt}/${MAX_RETRIES} that bai:`, lastError.message);

                this.bandwidthManager.recordFailure();

                if (attempt < MAX_RETRIES) {
                    const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1) + Math.random() * 500;
                    await this.sleep(delay);
                }
            }
        }

        throw lastError || new Error(`Failed to upload chunk ${partNumber} after ${MAX_RETRIES} attempts`);
    }

    private async uploadChunkInThread(
        file: File,
        chunk: Blob,
        chunkSize: number,
        offset: number,
        partNumber: number,
        presignedUrl: string,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<void> {
        try {
            const fingerPrint = await this.calculateChunkMD5(chunk);

            const {etag, uploadTimeMs} = await this.uploadChunkWithRetry(
                presignedUrl,
                chunk,
                partNumber,
                (loaded, _total) => {
                    const currentUploaded = this.uploadedBytes + loaded;
                    const percentage = Math.round((currentUploaded / file.size) * 100);
                    const stats = this.bandwidthManager.getStats();

                    onProgress?.({
                        uploadedBytes: currentUploaded,
                        totalBytes: file.size,
                        percentage,
                        currentChunk: this.legacyCompletedParts.length + 1,
                        totalChunks: this.totalChunksCreated,
                        throughputMbps: stats.throughputMbps,
                        estimatedTimeRemainingMs: 0,
                        currentChunkSize: chunkSize,
                        networkStability: stats.isPanicMode ? 'unstable' : 'stable',
                        activeThreads: this.semaphore?.getActivePermits() || 0,
                        maxThreads: this.semaphore?.getMaxPermits() || 0,
                    });
                }
            );

            const isValid = this.compareETagWithMD5(etag, fingerPrint);
            if (!isValid) {
                console.warn(`[thread ${partNumber}] etag khong khop! etag: ${etag}, md5: ${fingerPrint}`);
            }

            const remainingBytes = file.size - offset - chunkSize;
            const bandwidthStats = this.bandwidthManager.recordSuccess(
                chunkSize,
                uploadTimeMs,
                remainingBytes,
                partNumber
            );

            if (this.semaphore && bandwidthStats.nextThreads !== this.semaphore.getMaxPermits()) {
                this.semaphore.updateMaxPermits(bandwidthStats.nextThreads);
            }

            this.legacyCompletedParts.push({partNumber, etag});
            this.uploadedBytes += chunkSize;

            onProgress?.({
                uploadedBytes: this.uploadedBytes,
                totalBytes: file.size,
                percentage: Math.round((this.uploadedBytes / file.size) * 100),
                currentChunk: this.legacyCompletedParts.length,
                totalChunks: this.totalChunksCreated,
                throughputMbps: bandwidthStats.averageThroughputMbps,
                estimatedTimeRemainingMs: bandwidthStats.estimatedTimeRemainingMs,
                currentChunkSize: bandwidthStats.nextChunkSize,
                networkStability: this.bandwidthManager.getNetworkStability(),
                activeThreads: this.semaphore?.getActivePermits() || 0,
                maxThreads: this.semaphore?.getMaxPermits() || 0,
            });

        } finally {
            this.semaphore?.release();
        }
    }

    // duong legacy: client tu sinh objectName, goi thang /file-metadata/upload-metadata (E7)
    async uploadFile(
        file: File,
        metadata: {
            ownerId: string;
            timeToLive: number;
            compressionAlgo?: string;
        },
        onProgress?: (progress: UploadProgress) => void
    ): Promise<string> {
        if (file.size < MIN_MULTIPART_FILE_SIZE) {
            return await fileApiResource.directUpload(file);
        }

        this.abortController = new AbortController();
        this.uploadedBytes = 0;
        this.bandwidthManager.reset();

        this.legacyCompletedParts = [];
        this.uploadPromises = [];
        this.totalChunksCreated = 0;
        const initialThreads = this.bandwidthManager.getCurrentThreads();
        this.semaphore = new Semaphore(initialThreads);

        const objectName = uuidv4() + '_' + file.name;
        let uploadId: string | null = null;

        try {
            const mimeType = file.type || 'application/octet-stream';

            const response = await fileApiResource.initiateUpload(
                {
                    fileName: file.name,
                    objectName: objectName,
                    mimeType,
                    fileSize: file.size,
                    compressionAlgo: metadata.compressionAlgo,
                    timeToLive: metadata.timeToLive,
                },
                this.abortController.signal
            );

            uploadId = response.uploadId;
            this.legacyPartUrls = response.partUrl;

            let offset = 0;
            let partNumber = 1;
            let presignedUrl: string;

            while (offset < file.size) {
                const chunkSize = Math.min(
                    this.bandwidthManager.getCurrentChunkSize(),
                    file.size - offset
                );

                const chunk = file.slice(offset, offset + chunkSize);

                const currentPartNumber = partNumber;
                const currentOffset = offset;

                presignedUrl = this.legacyPartUrls.get(currentPartNumber)!;

                await this.semaphore.acquire();

                const uploadPromise = this.uploadChunkInThread(
                    file,
                    chunk,
                    chunkSize,
                    currentOffset,
                    currentPartNumber,
                    presignedUrl,
                    onProgress
                );

                this.uploadPromises.push(uploadPromise);

                offset += chunkSize;
                partNumber++;
            }

            await Promise.all(this.uploadPromises);

            this.legacyCompletedParts.sort((a, b) => a.partNumber - b.partNumber);

            await fileApiResource.completeUpload(
                {
                    uploadId,
                    objectName,
                    parts: this.legacyCompletedParts,
                },
                this.abortController.signal
            );

            return objectName;
        } catch (error) {
            const isUserCancelled = error instanceof Error &&
                (error.name === 'AbortError' || error.name === 'CanceledError');

            if (!isUserCancelled) {
                console.error('upload that bai:', error);
            }

            if (uploadId && objectName) {
                try {
                    await fileApiResource.abortUpload({uploadId, objectName});
                } catch (abortError) {
                    console.error('khong the huy upload:', abortError);
                }
            }

            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Upload failed: ${error}`);
        } finally {
            this.abortController = null;
            this.semaphore = null;
            this.uploadPromises = [];
        }
    }

    // ============================================================================================
    // Duong session v2 (E1-E5): partSize co dinh tu server, Content-MD5, resume, PartUrlManager
    // ============================================================================================

    private async uploadPartWithRetry(
        partNumber: number,
        chunk: Blob,
        md5Hex: string,
        urlManager: PartUrlManager,
        onChunkProgress?: (loaded: number, total: number) => void
    ): Promise<{ etag: string; uploadTimeMs: number }> {
        let networkAttempts = 0;
        let currentMd5Base64 = hexToBase64(md5Hex);
        let lastError: Error | null = null;

        while (networkAttempts < MAX_RETRIES) {
            const url = await urlManager.getUrl(partNumber);

            try {
                const startTime = performance.now();
                const etag = await fileApiResource.putPart(url, chunk, currentMd5Base64, this.abortController?.signal, onChunkProgress);
                const uploadTimeMs = performance.now() - startTime;

                if (!this.compareETagWithMD5(etag, md5Hex)) {
                    throw new Error(`ETag khong khop voi MD5 cho part ${partNumber}`);
                }

                return {etag, uploadTimeMs};
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (lastError.name === 'AbortError' || lastError.name === 'CanceledError') {
                    throw lastError;
                }

                const status = (error as { response?: { status?: number } })?.response?.status;

                if (status === 403) {
                    // url het han - xin lai dung part nay, khong tinh vao ngan sach retry mang
                    await urlManager.refetchUrl(partNumber);
                    continue;
                }

                if (status === 400) {
                    // BadDigest - tinh lai md5 va upload lai chinh part do
                    currentMd5Base64 = hexToBase64(await this.calculateChunkMD5(chunk));
                }

                console.warn(`part ${partNumber} upload lan thu ${networkAttempts + 1}/${MAX_RETRIES} that bai:`, lastError.message);
                this.bandwidthManager.recordFailure();

                networkAttempts++;
                if (networkAttempts < MAX_RETRIES) {
                    const delay = RETRY_DELAY_BASE * Math.pow(2, networkAttempts - 1) + Math.random() * 500;
                    await this.sleep(delay);
                }
            }
        }

        throw lastError || new Error(`Failed to upload part ${partNumber} after ${MAX_RETRIES} attempts`);
    }

    private async uploadPartInThread(
        file: File,
        chunk: Blob,
        chunkSize: number,
        partNumber: number,
        urlManager: PartUrlManager,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<void> {
        try {
            const md5Hex = await this.calculateChunkMD5(chunk);

            const {etag, uploadTimeMs} = await this.uploadPartWithRetry(
                partNumber,
                chunk,
                md5Hex,
                urlManager,
                (loaded) => {
                    const currentUploaded = this.uploadedBytes + loaded;
                    const percentage = Math.round((currentUploaded / file.size) * 100);
                    const stats = this.bandwidthManager.getStats();

                    onProgress?.({
                        uploadedBytes: currentUploaded,
                        totalBytes: file.size,
                        percentage,
                        currentChunk: this.completedParts.length + 1,
                        totalChunks: this.totalChunksCreated,
                        throughputMbps: stats.throughputMbps,
                        estimatedTimeRemainingMs: 0,
                        currentChunkSize: chunkSize,
                        networkStability: stats.isPanicMode ? 'unstable' : 'stable',
                        activeThreads: this.semaphore?.getActivePermits() || 0,
                        maxThreads: this.semaphore?.getMaxPermits() || 0,
                    });
                }
            );

            const remainingBytes = file.size - this.uploadedBytes - chunkSize;
            const bandwidthStats = this.bandwidthManager.recordSuccess(chunkSize, uploadTimeMs, remainingBytes, partNumber);

            if (this.semaphore && bandwidthStats.nextThreads !== this.semaphore.getMaxPermits()) {
                this.semaphore.updateMaxPermits(bandwidthStats.nextThreads);
            }

            this.completedParts.push({partNumber, etag, md5: md5Hex});
            this.uploadedBytes += chunkSize;

            onProgress?.({
                uploadedBytes: this.uploadedBytes,
                totalBytes: file.size,
                percentage: Math.round((this.uploadedBytes / file.size) * 100),
                currentChunk: this.completedParts.length,
                totalChunks: this.totalChunksCreated,
                throughputMbps: bandwidthStats.averageThroughputMbps,
                estimatedTimeRemainingMs: bandwidthStats.estimatedTimeRemainingMs,
                currentChunkSize: bandwidthStats.nextChunkSize,
                networkStability: this.bandwidthManager.getNetworkStability(),
                activeThreads: this.semaphore?.getActivePermits() || 0,
                maxThreads: this.semaphore?.getMaxPermits() || 0,
            });
        } finally {
            this.semaphore?.release();
        }
    }

    // resume: part da duoc MinIO nhan tu phien truoc (theo E3) khong upload lai, nhung van can md5
    // (gia tri client-side, server khong the tra lai) de dua vao E4 - doc lai dung byte do tu file
    // local (khong qua mang) roi bam lai, thay vi PUT lai ca part.
    private async reconcileReceivedParts(file: File, partSize: number, received: ReceivedPartDto[]): Promise<void> {
        for (const rp of received) {
            if (rp.partNumber === undefined || rp.etag === undefined) continue;
            const offset = (rp.partNumber - 1) * partSize;
            const size = toNumber(rp.size);
            const chunk = file.slice(offset, offset + size);
            const md5Hex = await this.calculateChunkMD5(chunk);
            this.completedParts.push({partNumber: rp.partNumber, etag: rp.etag, md5: md5Hex});
        }
    }

    private async uploadParts(
        file: File,
        partSize: number,
        urlManager: PartUrlManager,
        partNumbers: number[],
        onProgress?: (progress: UploadProgress) => void
    ): Promise<void> {
        const promises: Promise<void>[] = [];

        for (const partNumber of partNumbers) {
            const offset = (partNumber - 1) * partSize;
            const chunkSize = Math.min(partSize, file.size - offset);
            const chunk = file.slice(offset, offset + chunkSize);

            await this.semaphore!.acquire();

            promises.push(this.uploadPartInThread(file, chunk, chunkSize, partNumber, urlManager, onProgress));
        }

        this.uploadPromises.push(...promises);
        await Promise.all(promises);
        this.completedParts.sort((a, b) => a.partNumber - b.partNumber);
    }

    private async completeSessionWithRetry(
        file: File,
        sessionId: string,
        partSize: number,
        urlManager: PartUrlManager,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<UploadResourceResponseDto> {
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                return await fileApiResource.completeUploadSession(
                    sessionId,
                    this.completedParts.map(p => ({partNumber: p.partNumber, etag: p.etag, md5: p.md5})),
                    this.abortController?.signal
                );
            } catch (error) {
                const info = extractApiError(error);

                if (info.code === UploadErrorCode.UPLOAD_INCOMPLETE || info.code === UploadErrorCode.CHECKSUM_MISMATCH) {
                    const missing = parsePartListFromMessage(info.message);
                    if (missing.length === 0) throw error;

                    await urlManager.ensureUrlsFor(missing);
                    this.completedParts = this.completedParts.filter(p => !missing.includes(p.partNumber));
                    await this.uploadParts(file, partSize, urlManager, missing, onProgress);
                    continue;
                }

                throw error;
            }
        }

        throw new Error('Failed to complete upload session after compensating missing/mismatched parts');
    }

    // session tham so da duoc uploadManagerStore resolve dung (moi tu E1 hoac resume tu
    // findResumableSession) - o day chi can doc E3 mot lan de lay trang thai that (REL-01:
    // ListParts cua MinIO la nguon chan ly), bu phan con thieu roi complete.
    async uploadFileWithSession(
        file: File,
        session: AssetUploadSession,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<string> {
        this.abortController = new AbortController();
        this.uploadedBytes = 0;
        this.userCancelled = false;
        this.bandwidthManager.reset();
        this.bandwidthManager.setMode('upload');
        this.completedParts = [];
        this.uploadPromises = [];

        const sessionId = session.sessionId;
        let partSize = session.partSize;
        let partCount = session.partCount;
        let missingParts = Array.from({length: partCount}, (_, i) => i + 1);

        try {
            const status = await fileApiResource.getUploadSessionStatus(sessionId, this.abortController.signal);
            partSize = toNumber(status.partSize) || partSize;
            partCount = status.partCount ?? partCount;

            const receivedParts = status.receivedParts ?? [];
            const received = new Set(receivedParts.map(p => p.partNumber as number));
            missingParts = Array.from({length: partCount}, (_, i) => i + 1).filter(p => !received.has(p));
            this.uploadedBytes = receivedParts.reduce((sum, p) => sum + toNumber(p.size), 0);

            await this.reconcileReceivedParts(file, partSize, receivedParts);
        } catch (error) {
            console.error('khong doc duoc trang thai session, dung gia tri tu luc tao:', error);
        }

        const urlManager = new PartUrlManager(sessionId, partCount);
        if (session.urls.size > 0) {
            urlManager.seedInitial(session.urls, session.urlExpiresAt);
        }

        this.totalChunksCreated = partCount;
        const initialThreads = this.bandwidthManager.getCurrentThreads();
        this.semaphore = new Semaphore(initialThreads);

        try {
            if (missingParts.length > 0) {
                await this.uploadParts(file, partSize, urlManager, missingParts, onProgress);
            }

            const resource = await this.completeSessionWithRetry(file, sessionId, partSize, urlManager, onProgress);

            clearSessionSnapshot(file);
            return resource.objectName || session.objectName;
        } catch (error) {
            const isUserCancelled = this.userCancelled || (error instanceof Error &&
                (error.name === 'AbortError' || error.name === 'CanceledError'));

            if (isUserCancelled) {
                // huy chu dong: don session, khong de lai de resume
                try {
                    await fileApiResource.abortUploadSession(sessionId);
                } catch (abortError) {
                    console.error('khong the huy upload session:', abortError);
                }
                clearSessionSnapshot(file);
            } else {
                // loi khac (mang, checksum sau khi het retry...): GIU session de nguoi dung resume sau
                console.error('upload that bai, session con giu de resume:', error);
            }

            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Upload failed: ${error}`);
        } finally {
            this.abortController = null;
            this.semaphore = null;
            this.uploadPromises = [];
        }
    }

    // huy upload dang thuc hien
    cancelUpload(): void {
        this.userCancelled = true;
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }
}

export const uploadService = new UploadService();
