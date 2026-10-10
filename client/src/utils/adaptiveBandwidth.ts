
const DOWNLOAD_MIN_CHUNK_SIZE = 1 * 1024 * 1024;      // 1mb
const DOWNLOAD_MAX_CHUNK_SIZE = 50 * 1024 * 1024;     // 50mb
const DOWNLOAD_INITIAL_CHUNK_SIZE = 2 * 1024 * 1024;  // 2mb - cold start
const DOWNLOAD_TARGET_TIME_MIN = 1000;                // 1 giay - chunk qua nhanh
const DOWNLOAD_TARGET_TIME_MAX = 5000;                // 5 giay - chunk qua cham
const DOWNLOAD_MAX_THREADS = 5;
const DOWNLOAD_MIN_THREADS = 1;
const DOWNLOAD_INITIAL_THREADS = 1;

// upload - hill-climbing concurrency (WP5)
const UPLOAD_MAX_THREADS = 6;           // upload.max-threads - tran ~6 ket noi/host tren HTTP/1.1
const UPLOAD_MIN_THREADS = 1;
const UPLOAD_INITIAL_THREADS = 1;
const PROBE_EVALUATION_PARTS = 3;       // K part de danh gia mot lan probe
const PLATEAU_GAIN_THRESHOLD = 0.10;    // tang aggregate < 10% coi la plateau
const AGGREGATE_WINDOW_MS = 5000;       // cua so truot de do tong throughput dang chay

// ewma smoothing factor (0.3 = uu tien du lieu moi, nhung giu 70% ky uc cu) - dung chung ca 2 mode
const EWMA_ALPHA = 0.3;

// bandwidth limiting - su dung 70% bandwidth de khong gay nghen (download pacing + uoc tinh ETA)
const BANDWIDTH_UTILIZATION_TARGET = 0.7;

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

type ProbeState = 'idle' | 'probing' | 'cooldown';

export class AdaptiveBandwidthManager {
    private mode: 'upload' | 'download' = 'upload';

    // shared
    private averageThroughputBps: number = 0;
    private sampleCount: number = 0;
    private isPanicMode: boolean = false;
    private consecutiveFailures: number = 0;
    private throughputHistory: number[] = [];
    private readonly MAX_HISTORY_SIZE = 20;
    private currentThreads: number = UPLOAD_INITIAL_THREADS;

    // download-only: chunk size hien tai (upload khong bao gio doi gia tri nay, chi echo lai partSize)
    private currentChunkSize: number = DOWNLOAD_INITIAL_CHUNK_SIZE;

    // upload-only: state may hill-climbing
    private probeState: ProbeState = 'idle';
    private probeBaselineThroughputBps: number = 0;
    private partsSinceProbeAction: number = 0;
    private cooldownPartsRemaining: number = 0;
    private recentCompletions: Array<{ time: number; bytes: number }> = [];

    constructor() {
        this.reset();
    }

    setMode(mode: 'upload' | 'download'): void {
        this.mode = mode;
        this.reset();
    }

    getMode(): 'upload' | 'download' {
        return this.mode;
    }

    // reset ve trang thai ban dau
    reset(): void {
        this.averageThroughputBps = 0;
        this.sampleCount = 0;
        this.isPanicMode = false;
        this.consecutiveFailures = 0;
        this.throughputHistory = [];

        this.currentThreads = this.mode === 'upload' ? UPLOAD_INITIAL_THREADS : DOWNLOAD_INITIAL_THREADS;
        this.currentChunkSize = DOWNLOAD_INITIAL_CHUNK_SIZE;

        this.probeState = 'idle';
        this.probeBaselineThroughputBps = 0;
        this.partsSinceProbeAction = 0;
        this.cooldownPartsRemaining = 0;
        this.recentCompletions = [];
    }

    // lay kich thuoc chunk hien tai (chi co y nghia voi download; voi upload day la partSize server da cong bo)
    getCurrentChunkSize(): number {
        return this.currentChunkSize;
    }

    getCurrentThreads(): number {
        return this.currentThreads;
    }

    // ghi nhan ket qua thanh cong va tinh toan so luong thread tiep theo
    // chunkSizeBytes - kich thuoc chunk/part vua xong (bytes) - voi upload day la partSize co dinh
    // uploadTimeMs - thoi gian xu ly (milliseconds)
    // remainingBytes - so bytes con lai
    // partNumber - so thu tu (chi de log/debug)
    recordSuccess(
        chunkSizeBytes: number,
        uploadTimeMs: number,
        remainingBytes: number,
        partNumber?: number
    ): BandwidthStats {
        this.consecutiveFailures = 0;
        this.isPanicMode = false;

        const instantThroughputBps = (chunkSizeBytes / uploadTimeMs) * 1000;

        let nextChunkSize: number;
        let nextThreads: number;

        if (this.mode === 'upload') {
            // upload: partSize khong bao gio doi - chi hill-climbing so luong thread tren tong throughput
            nextChunkSize = chunkSizeBytes;
            nextThreads = this.hillClimbThreads(chunkSizeBytes);
        } else {
            if (this.sampleCount === 0) {
                this.averageThroughputBps = instantThroughputBps;
            } else {
                this.averageThroughputBps = EWMA_ALPHA * instantThroughputBps + (1 - EWMA_ALPHA) * this.averageThroughputBps;
            }
            const result = this.calculateNextDownloadChunkAndThreads(uploadTimeMs);
            nextChunkSize = result.nextChunkSize;
            nextThreads = result.nextThreads;
        }

        this.sampleCount++;
        this.throughputHistory.push(instantThroughputBps);
        if (this.throughputHistory.length > this.MAX_HISTORY_SIZE) {
            this.throughputHistory.shift();
        }

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

        this.currentChunkSize = nextChunkSize;
        this.currentThreads = nextThreads;

        if (partNumber !== undefined) {
            console.log(`[part ${partNumber}] threads=${stats.nextThreads} throughput=${stats.averageThroughputMbps.toFixed(2)}Mbps`);
        }

        return stats;
    }

    // ghi nhan loi - kich hoat panic mode
    recordFailure(): void {
        this.consecutiveFailures++;
        this.isPanicMode = true;

        if (this.mode === 'upload') {
            // upload: panic mode chi giam thread (san 1) - khong dung toi chunk size vi partSize co dinh
            this.currentThreads = Math.max(UPLOAD_MIN_THREADS, this.currentThreads - 1);
            this.probeState = 'idle';
            console.warn(`upload panic: giam thread xuong ${this.currentThreads}`);
            return;
        }

        if (this.consecutiveFailures >= 3) {
            this.currentChunkSize = DOWNLOAD_MIN_CHUNK_SIZE;
            this.currentThreads = DOWNLOAD_MIN_THREADS;
            console.warn('panic mode: nhieu loi lien tiep, reset ve chunk size toi thieu');
        } else {
            this.currentChunkSize = Math.max(DOWNLOAD_MIN_CHUNK_SIZE, Math.floor(this.currentChunkSize / 2));
            this.currentThreads = Math.max(DOWNLOAD_MIN_THREADS, this.currentThreads - 1);
            console.warn(`download that bai, giam chunk size xuong ${this.formatBytes(this.currentChunkSize)}`);
        }
    }

    // hill-climbing tren tong throughput (aggregate), chi danh cho upload:
    //   moi khi mot part hoan thanh:
    //     aggregate = EWMA(tong bytes hoan thanh / giay, cua so truot AGGREGATE_WINDOW_MS)
    //     neu dang cooldown sau 1 lan back-off -> giu nguyen, khong probe lai ngay
    //     neu threads < MAX_THREADS -> probe threads++ ; sau K part: tang < 10% -> lui 1 va cooldown, nguoc lai giu muc moi
    private hillClimbThreads(chunkSizeBytes: number): number {
        const now = performance.now();
        this.recentCompletions.push({time: now, bytes: chunkSizeBytes});
        this.recentCompletions = this.recentCompletions.filter(e => now - e.time <= AGGREGATE_WINDOW_MS);

        const windowBytes = this.recentCompletions.reduce((sum, e) => sum + e.bytes, 0);
        const windowSpanMs = this.recentCompletions.length > 1
            ? now - this.recentCompletions[0].time
            : 0;
        const aggregateInstantBps = windowSpanMs > 0 ? (windowBytes / windowSpanMs) * 1000 : (chunkSizeBytes > 0 ? this.averageThroughputBps || windowBytes : 0);

        this.averageThroughputBps = this.sampleCount === 0
            ? aggregateInstantBps
            : EWMA_ALPHA * aggregateInstantBps + (1 - EWMA_ALPHA) * this.averageThroughputBps;

        if (this.cooldownPartsRemaining > 0) {
            this.cooldownPartsRemaining--;
            return this.currentThreads;
        }

        if (this.probeState === 'idle') {
            if (this.currentThreads < UPLOAD_MAX_THREADS) {
                this.probeBaselineThroughputBps = this.averageThroughputBps;
                this.probeState = 'probing';
                this.partsSinceProbeAction = 0;
                return this.currentThreads + 1;
            }
            return this.currentThreads;
        }

        // probeState === 'probing'
        this.partsSinceProbeAction++;
        if (this.partsSinceProbeAction < PROBE_EVALUATION_PARTS) {
            return this.currentThreads;
        }

        const gain = this.probeBaselineThroughputBps > 0
            ? (this.averageThroughputBps - this.probeBaselineThroughputBps) / this.probeBaselineThroughputBps
            : 1;

        if (gain < PLATEAU_GAIN_THRESHOLD) {
            // plateau - pipe da day: lui ve threads-1 va giu on dinh, khong probe lai ngay
            this.probeState = 'cooldown';
            this.cooldownPartsRemaining = PROBE_EVALUATION_PARTS;
            return Math.max(UPLOAD_MIN_THREADS, this.currentThreads - 1);
        }

        // gain tot - giu muc moi, tiep tuc leo o lan goi ke tiep
        this.probeState = 'idle';
        return this.currentThreads;
    }

    // thuat toan cu cho download - GIU NGUYEN, ngoai pham vi WP5 (chi vá contentType o downloadService)
    private calculateNextDownloadChunkAndThreads(uploadTimeMs: number): {
        nextChunkSize: number;
        nextThreads: number;
    } {
        let nextChunkSize = this.currentChunkSize;
        let nextThreads = this.currentThreads;

        if (uploadTimeMs < DOWNLOAD_TARGET_TIME_MIN) {
            if (nextThreads < DOWNLOAD_MAX_THREADS) {
                nextThreads++;
            } else {
                nextChunkSize = Math.floor(this.currentChunkSize * 1.5);
            }
        } else if (uploadTimeMs > DOWNLOAD_TARGET_TIME_MAX) {
            if (nextChunkSize > DOWNLOAD_MIN_CHUNK_SIZE) {
                nextChunkSize = Math.floor(this.currentChunkSize / 1.2);
            } else if (nextThreads > DOWNLOAD_MIN_THREADS) {
                nextThreads--;
            }
        } else if (uploadTimeMs < (DOWNLOAD_TARGET_TIME_MIN + DOWNLOAD_TARGET_TIME_MAX) / 2) {
            if (nextThreads < DOWNLOAD_MAX_THREADS) {
                nextThreads++;
            }
        }

        nextChunkSize = Math.min(DOWNLOAD_MAX_CHUNK_SIZE, Math.max(DOWNLOAD_MIN_CHUNK_SIZE, nextChunkSize));
        nextThreads = Math.min(DOWNLOAD_MAX_THREADS, Math.max(DOWNLOAD_MIN_THREADS, nextThreads));

        return {nextChunkSize, nextThreads};
    }

    // tinh delay can thiet de dat target bandwidth utilization (70%) - dung cho download pacing
    calculatePacingDelay(chunkSizeBytes: number, uploadTimeMs: number): number {
        if (this.averageThroughputBps === 0) return 0;

        const idealTimeMs = (chunkSizeBytes / (this.averageThroughputBps * BANDWIDTH_UTILIZATION_TARGET)) * 1000;
        const delay = idealTimeMs - uploadTimeMs;

        return Math.max(0, delay);
    }

    // uoc tinh thoi gian con lai
    private estimateTimeRemaining(remainingBytes: number): number {
        if (this.averageThroughputBps === 0) return 0;

        // upload: averageThroughputBps da la tong (aggregate) qua hill-climbing, khong nhan lai currentThreads
        const effectiveThroughput = this.mode === 'upload'
            ? this.averageThroughputBps * BANDWIDTH_UTILIZATION_TARGET
            : this.averageThroughputBps * this.currentThreads * BANDWIDTH_UTILIZATION_TARGET;

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
