import baseApi, {API_BASE, type CommonResponse, tokenManager} from '../baseApi';
import axios from 'axios';
import type {MetadataEntity} from "./userFileApiResource.ts";
import {UploadSessionControllerService} from '../api/UploadSessionControllerService';
import type {
    AbortUploadSessionResponseDto,
    CompletedPartDto,
    PartUrlBatchResponseDto,
    UploadResourceResponseDto,
    UploadSessionStatusResponseDto,
} from '../api/index.defs';

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

// Ma loi dai 55xx cua upload session (01_api_contract.md §9) - CommonResponse.code tra ve dung
// chuoi so nay (vi du "5502"), khong phai ten hang so enum.
export const UploadErrorCode = {
    SESSION_NOT_FOUND: '5501',
    UPLOAD_INCOMPLETE: '5502',
    SIZE_MISMATCH: '5503',
    CHECKSUM_MISMATCH: '5504',
    SESSION_INVALID_STATE: '5505',
    SESSION_LIMIT_EXCEEDED: '5506',
    FILE_NOT_READY: '5507',
} as const;

export interface ApiErrorInfo {
    code?: string;
    message: string;
    httpStatus?: number;
}

// CommonResponse.code goc chua bi anh huong boi HTTP status - phan nhanh theo ca hai de an toan
export class UploadApiError extends Error {
    code?: string;
    httpStatus?: number;

    constructor(info: ApiErrorInfo) {
        super(info.message);
        this.name = 'UploadApiError';
        this.code = info.code;
        this.httpStatus = info.httpStatus;
    }
}

export const extractApiError = (error: unknown): ApiErrorInfo => {
    if (error instanceof UploadApiError) {
        return {code: error.code, message: error.message, httpStatus: error.httpStatus};
    }
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as { code?: string; message?: string } | undefined;
        return {
            code: data?.code,
            message: data?.message || error.message,
            httpStatus: error.response?.status,
        };
    }
    if (error instanceof Error) {
        return {message: error.message};
    }
    return {message: 'Unknown error'};
};

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

    // PUT part cho luong session v2 (E1/E2 urls): bat buoc Content-MD5, cam dat Content-Type (Hop dong PUT part)
    putPart: async (
        presignedUrl: string,
        chunk: Blob,
        contentMd5Base64: string,
        signal?: AbortSignal,
        onProgress?: (loaded: number, total: number) => void
    ): Promise<string> => {
        const response = await axios.put(presignedUrl, chunk, {
            headers: {
                'Content-MD5': contentMd5Base64,
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

    // ===== E2-E5: control plane cua luong upload session v2 =====

    requestPartUrls: async (
        sessionId: string,
        partNumbers: number[],
        signal?: AbortSignal
    ): Promise<PartUrlBatchResponseDto> => {
        try {
            const response = await UploadSessionControllerService.partUrls({
                sessionId,
                body: {partNumbers},
            }, {signal});

            if (!response?.isSuccessful || !response.data) {
                throw new UploadApiError({message: response?.message || 'Failed to get part urls', code: response?.code});
            }
            return response.data;
        } catch (error) {
            if (error instanceof UploadApiError) throw error;
            throw new UploadApiError(extractApiError(error));
        }
    },

    getUploadSessionStatus: async (
        sessionId: string,
        signal?: AbortSignal
    ): Promise<UploadSessionStatusResponseDto> => {
        try {
            const response = await UploadSessionControllerService.uploads({sessionId}, {signal});

            if (!response?.isSuccessful || !response.data) {
                throw new UploadApiError({message: response?.message || 'Failed to get upload session status', code: response?.code});
            }
            return response.data;
        } catch (error) {
            if (error instanceof UploadApiError) throw error;
            throw new UploadApiError(extractApiError(error));
        }
    },

    completeUploadSession: async (
        sessionId: string,
        parts: CompletedPartDto[],
        signal?: AbortSignal
    ): Promise<UploadResourceResponseDto> => {
        try {
            const response = await UploadSessionControllerService.complete({
                sessionId,
                body: {parts},
            }, {signal});

            if (!response?.isSuccessful || !response.data) {
                throw new UploadApiError({message: response?.message || 'Failed to complete upload session', code: response?.code});
            }
            return response.data;
        } catch (error) {
            if (error instanceof UploadApiError) throw error;
            throw new UploadApiError(extractApiError(error));
        }
    },

    abortUploadSession: async (
        sessionId: string,
        signal?: AbortSignal
    ): Promise<AbortUploadSessionResponseDto> => {
        try {
            const response = await UploadSessionControllerService.uploads1({sessionId}, {signal});

            if (!response?.isSuccessful || !response.data) {
                throw new UploadApiError({message: response?.message || 'Failed to abort upload session', code: response?.code});
            }
            return response.data;
        } catch (error) {
            if (error instanceof UploadApiError) throw error;
            throw new UploadApiError(extractApiError(error));
        }
    },

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

    restoreFileFromTrash: async (fileId: string, signal?: AbortSignal) =>
        baseApi.post<string>(`/file-metadata/restore-file/${fileId}`, signal),

    getFileByToken: async (shareToken: string) =>
        baseApi.get<MetadataEntity>(`/file-metadata/get-file-by-token/${shareToken}`),
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