import baseApi from '../baseApi';
import axios from 'axios';

interface PartUpload {
    partNumber: number;
    etag: string;
}

interface InitiateUploadResponseDto {
    uploadId: string;
    partUrl: Map<number, string>;
}

interface FileMetadata {
    fileName: string;
    objectName: string;
    mimeType: string;
    fileSize: number;
    compressionAlgo?: string;
    ownerId: number;
    creationTimestamp?: string;
    timeToLive: number;
}

interface GetPartUrlRequest {
    chunkName: string;
    uploadId: string;
    part: number;
    fingerPrint: string;
}

interface CompleteUploadRequest {
    uploadId: string;
    objectName: string;
    parts: PartUpload[];
}

interface AbortUploadRequest {
    uploadId: string;
    objectName: string;
}

interface DownloadFileRequest {
    objectName: string;
    downloadFileName?: string;
}

interface DownloadUrlResponse {
    url: string;
    fileSize: number;
    fileName: string;
    contentType: string;
}

const fileApiResource = {

    initiateUpload: async (data: FileMetadata, signal?: AbortSignal): Promise<{
        uploadId: string;
        partUrl: Map<number, string>;
    }> => {
        const response = await baseApi.post<InitiateUploadResponseDto>(
            '/file-metadata/upload-metadata',
            data,
            signal
        );

        // Convert plain object thành Map
        const partUrlMap = new Map<number, string>();
        if (response.partUrl) {
            Object.entries(response.partUrl).forEach(([key, value]) => {
                partUrlMap.set(Number(key), value);
            });
        }

        return {
            uploadId: response.uploadId,
            partUrl: partUrlMap,
        };
    },

    uploadChunk: async (
        presignedUrl: string,
        chunk: Blob,
        signal?: AbortSignal,
        onProgress?: (loaded: number, total: number) => void
    ): Promise<string> => {
        console.log(`dang upload chunk to url: ${presignedUrl}`);
        const response = await axios.put(presignedUrl, chunk, {
            headers: {
                'Content-Type': 'application/octet-stream',
            },
            signal,
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    onProgress(progressEvent.loaded, progressEvent.total);
                }
            },
        });

        const etag = response.headers['etag'];
        if (!etag) {
            throw new Error('ETag not found in response headers');
        }

        return etag.replace(/"/g, '');
    },

    completeUpload: (data: CompleteUploadRequest, signal?: AbortSignal) =>
        baseApi.post<string>('/file-metadata/upload/complete', data, signal),

    abortUpload: (data: AbortUploadRequest) =>
        baseApi.post<void>('/file-metadata/upload/stop-upload', data),

    getDownloadUrl: (data: DownloadFileRequest, signal?: AbortSignal) =>
        baseApi.post<DownloadUrlResponse>('/file-metadata/download', data, signal),

    downloadChunk: async (
        url: string,
        startByte: number,
        endByte: number,
        signal?: AbortSignal,
        onProgress?: (loaded: number, total: number) => void
    ): Promise<{ data: ArrayBuffer; downloadTimeMs: number }> => {
        const startTime = performance.now();
        
        const response = await axios.get(url, {
            headers: {
                'Range': `bytes=${startByte}-${endByte}`,
            },
            responseType: 'arraybuffer',
            signal,
            onDownloadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    onProgress(progressEvent.loaded, progressEvent.total);
                }
            },
        });

        const downloadTimeMs = performance.now() - startTime;
        
        return { 
            data: response.data as ArrayBuffer, 
            downloadTimeMs 
        };
    },
};

export default fileApiResource;
export type {
    PartUpload,
    InitiateUploadResponseDto,
    FileMetadata,
    GetPartUrlRequest,
    CompleteUploadRequest,
    AbortUploadRequest,
    DownloadFileRequest,
};