import fileApiResource, {UploadApiError} from '../api/fileApi/fileApiResource';

// PartUrlManager: giu pool presigned URL cho mot upload session, prefetch lo ke tiep khi pool
// con it, va xin lai URL cho dung part khi PUT tra 403 (url het han) - client chi cam sessionId,
// khong bao gio nhan/gui dinh danh object hay id multipart cua S3 (SEC-03).

const PREFETCH_THRESHOLD = 5;
const MAX_URL_BATCH_SIZE = 50; // 01_api_contract.md §0.5 - MAX_URL_BATCH_SIZE

export class PartUrlManager {
    private readonly pool = new Map<number, string>();
    private readonly requestedParts = new Set<number>();
    private urlExpiresAt: Date | null = null;
    private nextToPrefetch = 1;
    private prefetchInFlight: Promise<void> | null = null;

    constructor(
        private readonly sessionId: string,
        private readonly partCount: number,
    ) {
    }

    // seed lo URL dau tien tra ve tu E1 (K = min(partCount, 20))
    seedInitial(urls: Map<number, string>, urlExpiresAt: Date): void {
        urls.forEach((url, partNumber) => {
            this.pool.set(partNumber, url);
            this.requestedParts.add(partNumber);
        });
        this.urlExpiresAt = urlExpiresAt;
        this.nextToPrefetch = (urls.size > 0 ? Math.max(...urls.keys()) : 0) + 1;
    }

    getUrlExpiresAt(): Date | null {
        return this.urlExpiresAt;
    }

    async getUrl(partNumber: number): Promise<string> {
        if (!this.pool.has(partNumber)) {
            await this.fetchParts([partNumber]);
        }
        void this.maybePrefetch();

        const url = this.pool.get(partNumber);
        if (!url) {
            throw new Error(`Missing presigned URL for part ${partNumber}`);
        }
        return url;
    }

    // goi khi PUT tra 403 (url het han) - xin lai dung part nay, khong tinh vao ngan sach retry mang
    async refetchUrl(partNumber: number): Promise<string> {
        this.pool.delete(partNumber);
        this.requestedParts.delete(partNumber);
        await this.fetchParts([partNumber]);

        const url = this.pool.get(partNumber);
        if (!url) {
            throw new Error(`Failed to refresh presigned URL for part ${partNumber}`);
        }
        return url;
    }

    // dung cho resume/bu part: dam bao co url cho mot tap part (co the khong lien tuc), tu dong chia lo <=50
    async ensureUrlsFor(partNumbers: number[]): Promise<void> {
        const missing = partNumbers.filter(p => !this.pool.has(p) && !this.requestedParts.has(p));
        for (let i = 0; i < missing.length; i += MAX_URL_BATCH_SIZE) {
            await this.fetchParts(missing.slice(i, i + MAX_URL_BATCH_SIZE));
        }
    }

    private async maybePrefetch(): Promise<void> {
        if (this.pool.size >= PREFETCH_THRESHOLD) return;
        if (this.nextToPrefetch > this.partCount) return;
        if (this.prefetchInFlight) return;

        const batch: number[] = [];
        let scanTo = this.nextToPrefetch;
        while (scanTo <= this.partCount && batch.length < MAX_URL_BATCH_SIZE) {
            if (!this.requestedParts.has(scanTo)) batch.push(scanTo);
            scanTo++;
        }
        this.nextToPrefetch = scanTo;

        if (batch.length === 0) return;

        this.prefetchInFlight = this.fetchParts(batch)
            .catch(() => {
                // prefetch that bai khong lam hong luong chinh; getUrl se tu fetch lai khi thuc su can
            })
            .finally(() => {
                this.prefetchInFlight = null;
            });
    }

    private async fetchParts(partNumbers: number[]): Promise<void> {
        if (partNumbers.length === 0) return;
        partNumbers.forEach(p => this.requestedParts.add(p));

        try {
            const data = await fileApiResource.requestPartUrls(this.sessionId, partNumbers);

            const urls = data.urls as Record<string, string> | undefined;
            if (urls) {
                Object.entries(urls).forEach(([key, url]) => this.pool.set(Number(key), url));
            }
            if (data.urlExpiresAt) {
                this.urlExpiresAt = new Date(data.urlExpiresAt);
            }
        } catch (error) {
            partNumbers.forEach(p => this.requestedParts.delete(p));
            if (error instanceof UploadApiError) throw error;
            throw error;
        }
    }
}
