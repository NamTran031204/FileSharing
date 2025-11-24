import SparkMD5 from 'spark-md5';
import fileApi from '../api/fileApi/fileApiResource';
import type { PartUpload } from '../api/fileApi/fileApiResource';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadProgress {
    uploadedBytes: number;
    totalBytes: number;
    percentage: number;
    currentChunk: number;
    totalChunks: number;
}

export class UploadService {
    private abortController: AbortController | null = null;

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

    private compareETagWithMD5(etag: string, md5: string): boolean {
        const cleanETag = etag.replace(/"/g, '').toLowerCase();
        const cleanMD5 = md5.toLowerCase();

        return cleanETag === cleanMD5;
    }

    async uploadFile(
        file: File,
        metadata: {
            ownerId: number;
            timeToLive: number;
            compressionAlgo?: string;
        },
        onProgress?: (progress: UploadProgress) => void
    ): Promise<string> {
        this.abortController = new AbortController();
        let uploadId: string | null = null;
        let objectName: string | null = null;

        try {
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            console.log(`Total chunks: ${totalChunks}`);

            const mimeType = file.type || 'application/octet-stream';
            const creationTimestamp = new Date().toISOString();

            console.log('Initiating multipart upload...');
            uploadId = await fileApi.initiateUpload(
                {
                    fileName: file.name,
                    mimeType: mimeType,
                    fileSize: file.size,
                    compressionAlgo: metadata.compressionAlgo,
                    ownerId: metadata.ownerId,
                    creationTimestamp: creationTimestamp,
                    timeToLive: metadata.timeToLive,
                },
                this.abortController.signal
            );

            objectName = file.name;
            console.log(`Upload ID: ${uploadId}, Object: ${objectName}`);

            const parts: PartUpload[] = [];
            let uploadedBytes = 0;

            for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
                const start = (partNumber - 1) * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);

                console.log(`Processing part ${partNumber}/${totalChunks}...`);

                const fingerPrint = await this.calculateChunkMD5(chunk);
                console.log(`Chunk ${partNumber} MD5: ${fingerPrint}`);

                console.log(`Getting presigned URL for part ${partNumber}...`);
                const presignedUrl = await fileApi.getPartUploadUrl(
                    {
                        chunkName: objectName,
                        uploadId,
                        part: partNumber,
                        fingerPrint,
                    },
                    this.abortController.signal
                );

                // Upload chunk and get ETag
                console.log(`Uploading part ${partNumber}...`);
                const etag = await fileApi.uploadChunk(
                    presignedUrl,
                    chunk,
                    this.abortController.signal,
                    (loaded, total) => {
                        const chunkProgress = uploadedBytes + loaded;
                        const percentage = Math.round((chunkProgress / file.size) * 100);

                        onProgress?.({
                            uploadedBytes: chunkProgress,
                            totalBytes: file.size,
                            percentage,
                            currentChunk: partNumber,
                            totalChunks,
                        });
                    }
                );

                const isValid = this.compareETagWithMD5(etag, fingerPrint);
                console.log(`etag: ${etag}, MD5: ${fingerPrint}, valid: ${isValid}`);

                // Store part info
                parts.push({ partNumber, etag });
                uploadedBytes += chunk.size;

                console.log(`Part ${partNumber} uploaded. ETag: ${etag}`);
            }

            // complete
            console.log('Completing multipart upload...');
            await fileApi.completeUpload(
                {
                    uploadId,
                    objectName,
                    parts,
                },
                this.abortController.signal
            );
            console.log('Upload completed successfully!');

            return objectName;
        } catch (error) {
            // Cleanup on error
            if (uploadId && objectName) {
                console.log('Upload failed, aborting...');
                await fileApi.abortUpload({ uploadId, objectName });
            }

            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Upload failed: ${error}`);
        } finally {
            this.abortController = null;
        }
    }

    /**
     * Cancel ongoing upload
     */
    cancelUpload(): void {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }
}

// Export singleton instance
export const uploadService = new UploadService();