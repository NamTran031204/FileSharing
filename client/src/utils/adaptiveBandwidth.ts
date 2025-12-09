// adaptive bandwidth detection + limiting
// ket hop voi adaptive chunking algorithm

// constants
const MIN_CHUNK_SIZE = 5 * 1024 * 1024;        // 5mb
const MAX_CHUNK_SIZE = 50 * 1024 * 1024;   // 50mb - chuan s3
const INITIAL_CHUNK_SIZE = 5 * 1024 * 1024;    // 512kb - cold start
const TARGET_UPLOAD_TIME_MIN = 1000;       // 1 giay - chunk qua nhanh
const TARGET_UPLOAD_TIME_MAX = 5000;       // 5 giay - chunk qua cham

const DOWNLOAD_MIN_CHUNK_SIZE = 1 * 1024 * 1024;      // 1mb - chunk nho hon cho download
const DOWNLOAD_MAX_CHUNK_SIZE = 50 * 1024 * 1024;     // 50mb
const DOWNLOAD_INITIAL_CHUNK_SIZE = 2 * 1024 * 1024;  // 2mb - cold start cho download

// ewma smoothing factor (0.3 = uu tien du lieu moi, nhung giu 70% ky uc cu)
const EWMA_ALPHA = 0.3;

// bandwidth limiting - su dung 70% bandwidth de khong gay nghen
const BANDWIDTH_UTILIZATION_TARGET = 0.7;

const INITIAL_CONCURRENT_THREADS = 3;      // so luong khoi tao
const MAX_CONCURRENT_THREADS = 5;          // so luong toi da
const MIN_CONCURRENT_THREADS = 1;          // so luong toi thieu

export interface BandwidthStats {
    instantThroughputBps: number;      // bytes per second (tuc thoi)
    averageThroughputBps: number;      // bytes per second (ewma)
    averageThroughputMbps: number;     // megabits per second (hien thi)
    
    currentChunkSize: number;
    nextChunkSize: number;
    
    uploadTimeMs: number;
    
    sampleCount: number;
    
    estimatedTimeRemainingMs: number;

    currentThreads: number;
    nextThreads: number;
}

export class AdaptiveBandwidthManager {
    private averageThroughputBps: number = 0;
    private currentChunkSize: number = INITIAL_CHUNK_SIZE;
    private sampleCount: number = 0;
    private isPanicMode: boolean = false;
    private consecutiveFailures: number = 0;

    // luu lich su de phan tich
    private throughputHistory: number[] = [];
    private readonly MAX_HISTORY_SIZE = 20;

    private currentThreads: number = INITIAL_CONCURRENT_THREADS;
    private estimatedMaxBandwidthBps: number = 0;

    private mode: 'upload' | 'download' = 'upload';
    private minChunkSize: number = MIN_CHUNK_SIZE;
    private maxChunkSize: number = MAX_CHUNK_SIZE;
    private initialChunkSize: number = INITIAL_CHUNK_SIZE;

    constructor() {
        this.reset();
    }

    setMode(mode: 'upload' | 'download'): void {
        this.mode = mode;
        if (mode === 'download') {
            this.minChunkSize = DOWNLOAD_MIN_CHUNK_SIZE;
            this.maxChunkSize = DOWNLOAD_MAX_CHUNK_SIZE;
            this.initialChunkSize = DOWNLOAD_INITIAL_CHUNK_SIZE;
        } else {
            this.minChunkSize = MIN_CHUNK_SIZE;
            this.maxChunkSize = MAX_CHUNK_SIZE;
            this.initialChunkSize = INITIAL_CHUNK_SIZE;
        }
        this.currentChunkSize = this.initialChunkSize;
    }

    getMode(): 'upload' | 'download' {
        return this.mode;
    }

    // reset ve trang thai ban dau
    reset(): void {
        this.averageThroughputBps = 0;
        
        this.currentChunkSize = this.initialChunkSize;
        
        this.sampleCount = 0;
        this.isPanicMode = false;
        this.consecutiveFailures = 0;
        this.throughputHistory = [];

        this.currentThreads = INITIAL_CONCURRENT_THREADS;
        this.estimatedMaxBandwidthBps = 0;
    }

    // lay kich thuoc chunk hien tai de upload
    getCurrentChunkSize(): number {
        return this.currentChunkSize;
    }

    getCurrentThreads(): number {
        return this.currentThreads;
    }

    // ghi nhan ket qua upload thanh cong va tinh toan chunk size tiep theo
    // chunkSizeBytes - kich thuoc chunk vua upload (bytes)
    // uploadTimeMs - thoi gian upload (milliseconds)
    // remainingBytes - so bytes con lai can upload
    // tra ve BandwidthStats
    recordSuccess(
        chunkSizeBytes: number,
        uploadTimeMs: number,
        remainingBytes: number
    ): BandwidthStats {
        // reset panic mode khi thanh cong
        this.consecutiveFailures = 0;
        this.isPanicMode = false;

        // tinh thong luong tuc thoi (bytes/second)
        const instantThroughputBps = (chunkSizeBytes / uploadTimeMs) * 1000;

        // cap nhat ewma
        if (this.sampleCount === 0) {
            // lan dau tien - dung gia tri tuc thoi
            this.averageThroughputBps = instantThroughputBps;
        } else {
            // ewma: new_avg = alpha * new_value + (1 - alpha) * old_avg
            this.averageThroughputBps =
                EWMA_ALPHA * instantThroughputBps +
                (1 - EWMA_ALPHA) * this.averageThroughputBps;
        }

        this.sampleCount++;

        // luu vao lich su
        this.throughputHistory.push(instantThroughputBps);
        if (this.throughputHistory.length > this.MAX_HISTORY_SIZE) {
            this.throughputHistory.shift();
        }

        // tinh toan chunk size tiep theo
        const { nextChunkSize, nextThreads } = this.calculateNextChunkSizeAndThreads(uploadTimeMs);

        // tinh thoi gian con lai uoc tinh
        const estimatedTimeRemainingMs = this.estimateTimeRemaining(remainingBytes);

        const stats: BandwidthStats = {
            instantThroughputBps,
            averageThroughputBps: this.averageThroughputBps,
            averageThroughputMbps: (this.averageThroughputBps * 8) / (1024 * 1024),
            currentChunkSize: this.currentChunkSize,
            nextChunkSize,
            uploadTimeMs,
            sampleCount: this.sampleCount,
            estimatedTimeRemainingMs,

            currentThreads: this.currentThreads,
            nextThreads,
        };

        // cap nhat chunk size cho lan tiep theo
        this.currentChunkSize = nextChunkSize;

        this.currentThreads = nextThreads;

        return stats;
    }

    // ghi nhan loi upload - kich hoat panic mode
    recordFailure(): void {
        this.consecutiveFailures++;
        this.isPanicMode = true;

        // panic mode: giam chunk size xuong muc toi thieu
        if (this.consecutiveFailures >= 3) {
            // qua nhieu loi lien tiep - ve muc toi thieu
            this.currentChunkSize = MIN_CHUNK_SIZE;

            this.currentThreads = MIN_CONCURRENT_THREADS;
            console.warn('panic mode: nhieu loi lien tiep, reset ve chunk size toi thieu');
        } else {
            // giam manh chunk size
            this.currentChunkSize = Math.max(
                MIN_CHUNK_SIZE,
                Math.floor(this.currentChunkSize / 2)
            );

            this.currentThreads = Math.max(MIN_CONCURRENT_THREADS, this.currentThreads - 1);

            console.warn(`upload that bai, giam chunk size xuong ${this.formatBytes(this.currentChunkSize)}`);
        }
    }

    // tinh toan kich thuoc chunk va so luong tiep theo
    // logic:
    // - tinh tong throughput = chunk_size * so_luong
    // - neu chua dat 70% bandwidth: tang luong truoc, neu dat max luong thi tang chunk size
    // - neu qua 70% bandwidth: giam chunk size truoc, neu dat min chunk thi giam luong
    private calculateNextChunkSizeAndThreads(uploadTimeMs: number): { nextChunkSize: number; nextThreads: number } {
        let nextChunkSize = this.currentChunkSize;
        let nextThreads = this.currentThreads;

        // tinh tong throughput hien tai cua tat ca cac luong
        // totalThroughput = (chunkSize / uploadTime) * numThreads
        const currentTotalThroughputBps = (this.currentChunkSize / uploadTimeMs) * 1000 * this.currentThreads;

        // uoc tinh bandwidth toi da (lay max tu lich su * so luong)
        if (this.throughputHistory.length > 0) {
            const maxObservedThroughput = Math.max(...this.throughputHistory);
            this.estimatedMaxBandwidthBps = Math.max(
                this.estimatedMaxBandwidthBps,
                maxObservedThroughput * this.currentThreads * 1.2 // nhan 1.2 de co headroom
            );
        }

        // tinh bandwidth target (70%)
        // const targetBandwidthBps = this.estimatedMaxBandwidthBps * BANDWIDTH_UTILIZATION_TARGET;

        // tinh ty le su dung bandwidth hien tai
        const currentUtilization = this.estimatedMaxBandwidthBps > 0 
            ? currentTotalThroughputBps / this.estimatedMaxBandwidthBps 
            : 0;

        console.log(`bandwidth utilization: ${(currentUtilization * 100).toFixed(1)}% (target: 70%)`);

        if (uploadTimeMs < TARGET_UPLOAD_TIME_MIN) {
            // qua nhanh - can tang throughput
            console.log(`chunk qua nhanh (${uploadTimeMs}ms), can tang throughput`);
            
            if (currentUtilization < BANDWIDTH_UTILIZATION_TARGET) {
                // chua dat 70% bandwidth
                if (nextThreads < MAX_CONCURRENT_THREADS) {
                    // uu tien tang so luong truoc
                    nextThreads++;
                    console.log(`tang so luong len ${nextThreads}`);
                } else {
                    // da dat max luong, tang chunk size
                    nextChunkSize = Math.floor(this.currentChunkSize * 1.5);
                    console.log(`da dat max luong, tang chunk size`);
                }
            } else {
                // da dat/vuot 70% - giu nguyen
                console.log(`da dat 70% bandwidth, giu nguyen cai dat hien tai`);
            }
        } else if (uploadTimeMs > TARGET_UPLOAD_TIME_MAX) {
            // qua cham - can giam throughput
            console.log(`chunk qua cham (${uploadTimeMs}ms), can giam throughput`);
            
            // giam chunk size truoc
            if (nextChunkSize > this.minChunkSize) {
                nextChunkSize = Math.floor(this.currentChunkSize / 1.2);
                console.log(`giam chunk size`);
            } else if (nextThreads > MIN_CONCURRENT_THREADS) {
                // da dat min chunk, giam so luong
                nextThreads--;
                console.log(`da dat min chunk, giam so luong xuong ${nextThreads}`);
            }
        } else {
            // trong vung ly tuong
            console.log(`thoi gian chunk toi uu (${uploadTimeMs}ms), giu nguyen kich thuoc`);
            
            // van kiem tra neu chua dat 70% thi co the tang nhe
            if (currentUtilization < BANDWIDTH_UTILIZATION_TARGET * 0.8) {
                // duoi 56% (80% cua 70%) - co the tang nhe
                if (nextThreads < MAX_CONCURRENT_THREADS) {
                    nextThreads++;
                    console.log(`chua su dung het, tang so luong len ${nextThreads}`);
                }
            }
        }

        // gioi han gia tri trong pham vi cho phep
        nextChunkSize = Math.min(this.maxChunkSize, Math.max(this.minChunkSize, nextChunkSize));
        nextThreads = Math.min(MAX_CONCURRENT_THREADS, Math.max(MIN_CONCURRENT_THREADS, nextThreads));

        return { nextChunkSize, nextThreads };
    }

    // tinh delay can thiet de dat target bandwidth utilization (70%)
    // giup khong chiem het bang thong cua user
    calculatePacingDelay(chunkSizeBytes: number, uploadTimeMs: number): number {
        if (this.averageThroughputBps === 0) return 0;

        // thoi gian ly tuong de upload chunk nay voi 70% bandwidth
        const idealTimeMs = (chunkSizeBytes / (this.averageThroughputBps * BANDWIDTH_UTILIZATION_TARGET)) * 1000;

        // neu upload nhanh hon thoi gian ly tuong, can delay
        const delay = idealTimeMs - uploadTimeMs;

        return Math.max(0, delay);
    }

    // uoc tinh thoi gian con lai
    private estimateTimeRemaining(remainingBytes: number): number {
        if (this.averageThroughputBps === 0) return 0;

        // tinh voi bandwidth da bi limit (70%)
        const effectiveThroughput = this.averageThroughputBps * this.currentThreads * BANDWIDTH_UTILIZATION_TARGET;
        return (remainingBytes / effectiveThroughput) * 1000;
    }

    // lay thong tin thong ke hien tai
    getStats(): { throughputMbps: number; chunkSize: number; isPanicMode: boolean; currentThreads: number } {
        return {
            throughputMbps: (this.averageThroughputBps * 8) / (1024 * 1024),
            chunkSize: this.currentChunkSize,
            isPanicMode: this.isPanicMode,
            currentThreads: this.currentThreads,
        };
    }

    // kiem tra do on dinh cua mang dua tren variance cua throughput
    getNetworkStability(): 'stable' | 'unstable' | 'unknown' {
        if (this.throughputHistory.length < 3) return 'unknown';

        const avg = this.throughputHistory.reduce((a, b) => a + b, 0) / this.throughputHistory.length;
        const variance = this.throughputHistory.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / this.throughputHistory.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = stdDev / avg;

        // cv < 0.3 = on dinh, > 0.5 = khong on dinh
        if (coefficientOfVariation < 0.3) return 'stable';
        if (coefficientOfVariation > 0.5) return 'unstable';
        return 'stable';
    }

    private formatBytes(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
}

// singleton instance
export const adaptiveBandwidthManager = new AdaptiveBandwidthManager();