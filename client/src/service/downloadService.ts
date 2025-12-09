import fileApiResource from '../api/fileApi/fileApiResource';
import { AdaptiveBandwidthManager } from '../utils/adaptiveBandwidth';

const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;

export interface DownloadProgress {
    downloadedBytes: number;
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

interface DownloadedChunk {
    partNumber: number;
    data: ArrayBuffer;
    startByte: number;
    endByte: number;
}

class Semaphore {
    private permits: number;
    private maxPermits: number;
    private waitingQueue: Array<() => void> = [];

    constructor(initialPermits: number) {
        this.permits = initialPermits;
        this.maxPermits = initialPermits;
    }

    // lay mot permit, cho neu khong co permit available
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

    // release mot permit, cho phep mot waiter tiep tuc
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

    // cap nhat so luong permits toi da (cho adaptive threading)
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


export class DownloadService {
    private abortController: AbortController | null = null;
    
    private bandwidthManager: AdaptiveBandwidthManager;
    
    private semaphore: Semaphore | null = null;
    
    private downloadedChunks: DownloadedChunk[] = [];
    
    private downloadPromises: Promise<void>[] = [];
    
    private downloadedBytes: number = 0;
    
    private totalChunksCreated: number = 0;

    constructor() {
        this.bandwidthManager = new AdaptiveBandwidthManager();
        this.bandwidthManager.setMode('download');
    }

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

    private async downloadChunkWithRetry(
        presignedUrl: string,
        startByte: number,
        endByte: number,
        partNumber: number,
        onChunkProgress?: (loaded: number, total: number) => void
    ): Promise<{ data: ArrayBuffer; downloadTimeMs: number }> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const result = await fileApiResource.downloadChunk(
                    presignedUrl,
                    startByte,
                    endByte,
                    this.abortController?.signal,
                    onChunkProgress
                );

                return result;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                // khong retry neu bi abort
                if (lastError.name === 'AbortError' || lastError.name === 'CanceledError') {
                    throw lastError;
                }

                console.warn(`chunk ${partNumber} download lan thu ${attempt}/${MAX_RETRIES} that bai:`, lastError.message);

                // ghi nhan failure cho bandwidth manager
                this.bandwidthManager.recordFailure();

                if (attempt < MAX_RETRIES) {
                    // exponential backoff voi jitter
                    const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1) + Math.random() * 500;
                    console.log(`thu lai sau ${delay.toFixed(0)}ms...`);
                    await this.sleep(delay);
                }
            }
        }

        throw lastError || new Error(`Failed to download chunk ${partNumber} after ${MAX_RETRIES} attempts`);
    }

    private async downloadChunkInThread(
        presignedUrl: string,
        startByte: number,
        endByte: number,
        chunkSize: number,
        partNumber: number,
        totalFileSize: number,
        onProgress?: (progress: DownloadProgress) => void
    ): Promise<void> {
        try {
            console.log(`[thread] part ${partNumber}: ${this.formatBytes(chunkSize)} (bytes: ${startByte}-${endByte})`);

            // download chunk voi retry
            console.log(`[thread ${partNumber}] dang download...`);
            const { data, downloadTimeMs } = await this.downloadChunkWithRetry(
                presignedUrl,
                startByte,
                endByte,
                partNumber,
                (loaded, _total) => {
                    // progress callback trong khi download
                    const currentDownloaded = this.downloadedBytes + loaded;
                    const percentage = Math.round((currentDownloaded / totalFileSize) * 100);
                    const stats = this.bandwidthManager.getStats();

                    onProgress?.({
                        downloadedBytes: currentDownloaded,
                        totalBytes: totalFileSize,
                        percentage,
                        currentChunk: this.downloadedChunks.length + 1,
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

            // ghi nhan thanh cong va lay stats moi
            const remainingBytes = totalFileSize - endByte - 1;
            const bandwidthStats = this.bandwidthManager.recordSuccess(
                chunkSize,
                downloadTimeMs,
                remainingBytes
            );

            console.log(`[thread ${partNumber}] da download trong ${downloadTimeMs.toFixed(0)}ms`);
            console.log(`[thread ${partNumber}] throughput: ${bandwidthStats.averageThroughputMbps.toFixed(2)} mbps`);

            const pacingDelay = this.bandwidthManager.calculatePacingDelay(chunkSize, downloadTimeMs);
            if (pacingDelay > 0) {
                console.log(`[thread ${partNumber}] pacing delay: ${pacingDelay.toFixed(0)}ms`);
                await this.sleep(pacingDelay);
            }

            this.downloadedChunks.push({
                partNumber,
                data,
                startByte,
                endByte,
            });
            this.downloadedBytes += chunkSize;

            // cap nhat progress sau khi hoan thanh chunk
            onProgress?.({
                downloadedBytes: this.downloadedBytes,
                totalBytes: totalFileSize,
                percentage: Math.round((this.downloadedBytes / totalFileSize) * 100),
                currentChunk: this.downloadedChunks.length,
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

    // ghep cac chunks thanh mot blob hoan chinh
    private assembleChunks(contentType: string): Blob {
        this.downloadedChunks.sort((a, b) => a.startByte - b.startByte);

        const buffers = this.downloadedChunks.map(chunk => chunk.data);

        return new Blob(buffers, { type: contentType });
    }

    // download file voi adaptive chunking va da luong
    // objectName - ten object tren server
    // downloadFileName - ten file khi download (optional)
    // onProgress - callback theo doi tien trinh
    // tra ve blob chua du lieu file
    async downloadFile(
        objectName: string,
        downloadFileName?: string,
        onProgress?: (progress: DownloadProgress) => void
    ): Promise<{ blob: Blob; fileName: string }> {
        // reset state
        this.abortController = new AbortController();
        this.downloadedBytes = 0;
        this.bandwidthManager.reset();
        this.bandwidthManager.setMode('download');

        this.downloadedChunks = [];
        this.downloadPromises = [];
        this.totalChunksCreated = 0;

        const initialThreads = this.bandwidthManager.getCurrentThreads();
        this.semaphore = new Semaphore(initialThreads);
        console.log(`so luong thread download ban dau: ${initialThreads}`);

        try {
            console.log('dang khoi tao file download...');
            console.log(`object: ${objectName}`);

            // lay presigned url de download
            const downloadInfo = await fileApiResource.getDownloadUrl(
                {
                    objectName,
                    downloadFileName,
                },
                this.abortController.signal
            );

            console.log(`da lay presigned download url`);

            const presignedUrl = downloadInfo.url;
            const fileSize = downloadInfo.fileSize;
            const contentType = downloadInfo.contentType;

            // lay thong tin file (size) bang head request
            // const { fileSize, contentType } = await fileApi.getFileInfo(
            //     presignedUrl,
            //     this.abortController.signal
            // );

            console.log(`kich thuoc file: ${this.formatBytes(fileSize)}, loai: ${contentType}`);

            let offset = 0;
            let partNumber = 1;

            // vong lap adaptive chunking
            while (offset < fileSize) {
                const chunkSize = Math.min(
                    this.bandwidthManager.getCurrentChunkSize(),
                    fileSize - offset
                );

                const startByte = offset;
                const endByte = offset + chunkSize - 1;

                const currentPartNumber = partNumber;
                const currentStartByte = startByte;
                const currentEndByte = endByte;
                const currentChunkSize = chunkSize;

                this.totalChunksCreated++;

                console.log(`part ${partNumber}: ${this.formatBytes(chunkSize)} (bytes: ${startByte}-${endByte})`);

                console.log(`dang cho thread san sang... (dang chay: ${this.semaphore.getActivePermits()}/${this.semaphore.getMaxPermits()})`);
                await this.semaphore.acquire();
                console.log(`da lay thread cho part ${partNumber} (dang chay: ${this.semaphore.getActivePermits()}/${this.semaphore.getMaxPermits()})`);

                const downloadPromise = this.downloadChunkInThread(
                    presignedUrl,
                    currentStartByte,
                    currentEndByte,
                    currentChunkSize,
                    currentPartNumber,
                    fileSize,
                    onProgress
                ).catch((error) => {
                    console.error(`[thread ${currentPartNumber}] that bai:`, error);
                    throw error;
                });

                this.downloadPromises.push(downloadPromise);

                offset += chunkSize;
                partNumber++;
            }

            console.log(`dang cho tat ca ${this.downloadPromises.length} chunk hoan thanh...`);
            await Promise.all(this.downloadPromises);
            console.log(`tat ca cac chunk da download thanh cong`);

            // ghep cac chunks thanh file
            console.log('dang ghep cac chunks thanh file...');
            const blob = this.assembleChunks(contentType);

            console.log('download hoan thanh thanh cong!');

            // xac dinh ten file
            const fileName = downloadFileName || objectName.split('_').slice(1).join('_') || objectName;

            return { blob, fileName };

        } catch (error) {
            const isUserCancelled = error instanceof Error &&
                (error.name === 'AbortError' || error.name === 'CanceledError');

            if (isUserCancelled) {
                console.log('download da bi huy boi nguoi dung');
            } else {
                console.error('download that bai:', error);
            }

            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Download failed: ${error}`);

        } finally {
            this.abortController = null;
            this.semaphore = null;
            this.downloadPromises = [];
        }
    }

    // download file va trigger browser download
    // objectName - ten object tren server
    // downloadFileName - ten file khi download (optional)
    // onProgress - callback theo doi tien trinh
    async downloadAndSave(
        objectName: string,
        downloadFileName?: string,
        onProgress?: (progress: DownloadProgress) => void
    ): Promise<void> {
        const { blob, fileName } = await this.downloadFile(objectName, downloadFileName, onProgress);

        // tao url tam va trigger download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // don dep url
        setTimeout(() => URL.revokeObjectURL(url), 100);

        console.log(`da luu file: ${fileName}`);
    }

    // huy download dang chay
    cancelDownload(): void {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    // kiem tra xem co download dang chay khong
    isDownloading(): boolean {
        return this.abortController !== null;
    }
}

// singleton instance
export const downloadService = new DownloadService();