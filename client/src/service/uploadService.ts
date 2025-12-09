import SparkMD5 from 'spark-md5';
import fileApiResource from '../api/fileApi/fileApiResource';
import type { PartUpload } from '../api/fileApi/fileApiResource';
import { AdaptiveBandwidthManager} from '../utils/adaptiveBandwidth';
import { v4 as uuidv4 } from 'uuid';

// Constants
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;             // 1 second base delay

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
    private partUrls: Map<number, string> = new Map();
    private completedParts: PartUpload[] = [];
    private uploadPromises: Promise<void>[] = [];
    private totalChunksCreated: number = 0;

    constructor() {
        this.bandwidthManager = new AdaptiveBandwidthManager();
    }

    // tinh md5 hash cua mot chunk
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

    // upload mot chunk voi retry logic
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

                return { etag, uploadTimeMs };
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                // neu abort thi khong retry
                if (lastError.name === 'AbortError' || lastError.name === 'CanceledError') {
                    throw lastError;
                }

                console.warn(`chunk ${partNumber} upload lan thu ${attempt}/${MAX_RETRIES} that bai:`, lastError.message);

                // ghi nhan failure cho bandwidth manager
                this.bandwidthManager.recordFailure();

                if (attempt < MAX_RETRIES) {
                    // exponential backoff voi jitter
                    const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1) + Math.random() * 500;
                    console.log(`thu lai sau ${delay.toFixed(0)}ms`);
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
            console.log(`[thread] part ${partNumber}: ${this.formatBytes(chunkSize)} (offset: ${this.formatBytes(offset)})`);

            // tinh md5 de xac minh
            const fingerPrint = await this.calculateChunkMD5(chunk);
            console.log(`[thread ${partNumber}] md5: ${fingerPrint}`);

            // upload chunk voi retry
            console.log(`[thread ${partNumber}] dang upload...`);
            const { etag, uploadTimeMs } = await this.uploadChunkWithRetry(
                presignedUrl,
                chunk,
                partNumber,
                (loaded, _total) => {
                    // progress callback trong khi upload
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

            // xac minh etag
            const isValid = this.compareETagWithMD5(etag, fingerPrint);
            if (!isValid) {
                console.warn(`[thread ${partNumber}] etag khong khop! etag: ${etag}, md5: ${fingerPrint}`);
            }

            // ghi nhan thanh cong va lay stats moi
            const remainingBytes = file.size - offset - chunkSize;
            const bandwidthStats = this.bandwidthManager.recordSuccess(
                chunkSize,
                uploadTimeMs,
                remainingBytes
            );

            console.log(`[thread ${partNumber}] da upload trong ${uploadTimeMs.toFixed(0)}ms`);
            console.log(`[thread ${partNumber}] throughput: ${bandwidthStats.averageThroughputMbps.toFixed(2)} mbps`);

            // cap nhat so luong neu can
            if (this.semaphore && bandwidthStats.nextThreads !== this.semaphore.getMaxPermits()) {
                console.log(`dang cap nhat threads: ${this.semaphore.getMaxPermits()} -> ${bandwidthStats.nextThreads}`);
                this.semaphore.updateMaxPermits(bandwidthStats.nextThreads);
            }

            // luu part info (thread-safe vi js la single-threaded event loop)
            this.completedParts.push({ partNumber, etag });
            this.uploadedBytes += chunkSize;

            // cap nhat progress sau khi hoan thanh chunk
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
            // luon release semaphore khi hoan thanh (du thanh cong hay that bai)
            this.semaphore?.release();
        }
    }

    // ham upload chinh voi adaptive chunking
    async uploadFile(
        file: File,
        metadata: {
            ownerId: number;
            timeToLive: number;
            compressionAlgo?: string;
        },
        onProgress?: (progress: UploadProgress) => void
    ): Promise<string> {
        // reset state
        this.abortController = new AbortController();
        this.uploadedBytes = 0;
        this.bandwidthManager.reset();

        this.completedParts = [];
        this.uploadPromises = [];
        this.totalChunksCreated = 0;
        const initialThreads = this.bandwidthManager.getCurrentThreads();
        this.semaphore = new Semaphore(initialThreads);
        console.log(`so luong thread ban dau: ${initialThreads}`);

        const objectName = uuidv4() + '_' + file.name;
        let uploadId: string | null = null;

        try {
            const mimeType = file.type || 'application/octet-stream';
            const creationTimestamp = new Date().toISOString();

            console.log('dang khoi tao multipart upload...');
            console.log(`file: ${file.name}, kich thuoc: ${this.formatBytes(file.size)}`);

            // khoi tao upload
            const response = await fileApiResource.initiateUpload(
                {
                    fileName: file.name,
                    objectName: objectName,
                    mimeType,
                    fileSize: file.size,
                    compressionAlgo: metadata.compressionAlgo,
                    ownerId: metadata.ownerId,
                    creationTimestamp,
                    timeToLive: metadata.timeToLive,
                },
                this.abortController.signal
            );

            uploadId = response.uploadId;
            this.partUrls = response.partUrl;

            console.log(`upload id: ${uploadId}, object: ${objectName}`);

            let offset = 0;
            let partNumber = 1;
            let presignedUrl: string;

            // vong lap adaptive chunking
            while (offset < file.size) {
                // lay chunk size duoc de xuat tu bandwidth manager
                const chunkSize = Math.min(
                    this.bandwidthManager.getCurrentChunkSize(),
                    file.size - offset
                );

                const chunk = file.slice(offset, offset + chunkSize);

                const currentPartNumber = partNumber;
                const currentOffset = offset;

                presignedUrl = this.partUrls.get(currentPartNumber)!;

                console.log(`part ${partNumber}: ${this.formatBytes(chunkSize)} (offset: ${this.formatBytes(offset)})`);

                console.log(`dang cho thread san sang... (dang chay: ${this.semaphore.getActivePermits()}/${this.semaphore.getMaxPermits()})`);
                await this.semaphore.acquire();
                console.log(`da lay thread cho part ${partNumber} (dang chay: ${this.semaphore.getActivePermits()}/${this.semaphore.getMaxPermits()})`);

                const uploadPromise = this.uploadChunkInThread(
                    file,
                    chunk,
                    chunkSize,
                    currentOffset,
                    currentPartNumber,
                    presignedUrl,
                    onProgress
                ).catch((error) => {
                    // log loi nhung khong throw de cac luong khac tiep tuc
                    console.error(`[thread ${currentPartNumber}] that bai:`, error);
                    throw error; // Re-throw để Promise.all catch được
                });

                // ghi nhan thanh cong va lay stats moi
                const remainingBytes = file.size - offset - chunkSize;
                console.log("remainingBytes: " + remainingBytes);
                this.uploadPromises.push(uploadPromise);

                offset += chunkSize;
                partNumber++;
            }

            console.log(`dang cho tat ca ${this.uploadPromises.length} chunk hoan thanh...`);
            await Promise.all(this.uploadPromises);
            console.log(`tat ca cac chunk da upload thanh cong`);

            this.completedParts.sort((a, b) => a.partNumber - b.partNumber);

            // hoan thanh multipart upload
            console.log('dang hoan thanh multipart upload...');
            await fileApiResource.completeUpload(
                {
                    uploadId,
                    objectName,
                    parts: this.completedParts,
                },
                this.abortController.signal
            );

            console.log('upload hoan thanh thanh cong!');

            return objectName;
        } catch (error) {
            const isUserCancelled = error instanceof Error &&
                (error.name === 'AbortError' || error.name === 'CanceledError');

            if (isUserCancelled) {
                console.log('upload da bi huy boi nguoi dung');
            } else {
                console.error('upload that bai:', error);
            }

            // don dep upload chua hoan thanh
            if (uploadId && objectName) {
                console.log('dang don dep upload chua hoan thanh...');
                try {
                    await fileApiResource.abortUpload({ uploadId, objectName });
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

    // huy upload dang thuc hien
    cancelUpload(): void {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    // dinh dang bytes thanh chuoi doc duoc
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    }
}

export const uploadService = new UploadService();