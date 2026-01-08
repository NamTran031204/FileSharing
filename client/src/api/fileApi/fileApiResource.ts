import baseApi, {API_BASE, type CommonResponse, tokenManager} from '../baseApi';
import axios from 'axios';

interface PartUpload {
    partNumber: number;
    etag: string;
}

interface InitiateUploadResponseDto {
    uploadId: string;
    partUrl: Map<number, string>;
}

interface MetadataDto {
    fileName: string;
    objectName: string;
    mimeType: string;
    fileSize: number;
    compressionAlgo?: string;
    timeToLive: number;
}

interface CompleteUploadRequest {
    uploadId: string;
    objectName: string;
    parts: PartUpload[];
}

interface AbortUploadRequestDto {
    uploadId: string;
    objectName: string;
}

interface DownloadFileRequestDto {
    objectName: string;
    downloadFileName?: string;
}

interface DownloadFileResponseDto {
    url: string;
    fileSize: number;
    fileName: string;
    contentType: string;
}

interface DirectDownloadRequestDto {
    objectName: string;
}

const fileApiResource = {

    initiateUpload: async (data: MetadataDto, signal?: AbortSignal): Promise<{
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

    abortUpload: (data: AbortUploadRequestDto) =>
        baseApi.post<void>('/file-metadata/upload/stop-upload', data),

    getDownloadUrl: (data: DownloadFileRequestDto, signal?: AbortSignal) =>
        baseApi.post<DownloadFileResponseDto>('/file-metadata/download', data, signal),

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

    directUpload: async (file: File, signal?: AbortSignal): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        const token = tokenManager.getAccessToken();

        const response = await axios.post<CommonResponse<string>>(
            `${API_BASE}/file-metadata/direct-upload`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                },
                signal
            }
        );
        if (!response.data.isSuccessful) {
            throw new Error(response.data.message || 'Direct upload failed');
        }

        return response.data.data;
    },

    directDownload: async (objectName: string, signal?: AbortSignal): Promise<ArrayBuffer> => {
        const response = await axios.post<CommonResponse<number[]>>(
            `${API_BASE}/file-metadata/direct-download`,
            {objectName} as DirectDownloadRequestDto,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                signal
            }
        );

        if (!response.data.isSuccessful) {
            throw new Error(response.data.message || 'Direct download failed');
        }

        // chuyen tu byte[] sang buffer array
        const byteArray = new Uint8Array(response.data.data);
        return byteArray.buffer;
    },

    deleteFile: async (fileId: string, signal?: AbortSignal) =>
        baseApi.delete<string>(`/file-metadata/${fileId}`, signal),

    moveToTrash: async (fileId: string, signal?: AbortSignal) =>
        baseApi.delete<string>(`/file-metadata/move-to-trash/${fileId}`, signal),
};

export default fileApiResource;
export type {
    PartUpload,
    InitiateUploadResponseDto,
    MetadataDto,
    CompleteUploadRequest,
    AbortUploadRequestDto,
    DownloadFileRequestDto,
    DirectDownloadRequestDto,
};