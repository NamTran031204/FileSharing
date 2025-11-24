import baseApi from '../baseApi';
import axios from 'axios';

interface PartUpload {
    partNumber: number;
    etag: string;
}

interface InitiateUploadResponse {
    uploadId: string;
    fileId: string;
}

interface FileMetadata {
    fileName: string;
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

const fileApi = {

    initiateUpload: (data: FileMetadata, signal?: AbortSignal) =>
        baseApi.post<string>('/file-metadata/upload-metadata', data, signal),

    getPartUploadUrl: (data: GetPartUrlRequest, signal?: AbortSignal) =>
        baseApi.post<string>('/chunk/create-upload-url', data, signal),

    uploadChunk: async (
        presignedUrl: string,
        chunk: Blob,
        signal?: AbortSignal,
        onProgress?: (loaded: number, total: number) => void
    ): Promise<string> => {
        console.log(`Uploading chunk to URL: ${presignedUrl}`);
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
};

export default fileApi;
export type {
    PartUpload,
    InitiateUploadResponse,
    FileMetadata,
    GetPartUrlRequest,
    CompleteUploadRequest,
    AbortUploadRequest,
};