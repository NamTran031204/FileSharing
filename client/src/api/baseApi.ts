const API_BASE = "http://localhost:8080/api";

export interface CommonResponse<T> {
    isSuccessful: boolean;
    data: T;
    code: string;
    message: string;
}

export interface PageRequest<T> {
    maxResultCount: number;
    skipCount: number;
    sorting: string;
    filter: T;
}

export interface PageResult<T> {
    totalCount: number;
    data: T[];
}

export class ApiError extends Error {
    code: string;
    httpStatus?: number;

    constructor(code: string, message: string, httpStatus?: number) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.httpStatus = httpStatus;
    }
}

async function requestRaw<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...init,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new ApiError('HTTP_ERROR', text || `HTTP ${res.status}`, res.status);
    }

    if (res.status === 204) return undefined as unknown as T;

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return (await res.json()) as T;
    } else {
        return (await res.text()) as T;
    }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await requestRaw<CommonResponse<T>>(path, init);

    // Kiểm tra nếu response là CommonResponse
    if (response && typeof response === 'object' && 'isSuccessful' in response) {
        if (!response.isSuccessful) {
            throw new ApiError(response.code, response.message);
        }
        return response.data;
    }

    // nếu không phải CommonResponse thì trả về nguyên response
    return response as unknown as T;
}

const baseApi = {
    get: <T>(path: string, signal?: AbortSignal) => 
        request<T>(path, { signal }),
    post: <T>(path: string, body: unknown, signal?: AbortSignal) =>
        request<T>(path, { method: "POST", body: JSON.stringify(body), signal }),
    put: <T>(path: string, body: unknown, signal?: AbortSignal) =>
        request<T>(path, { method: "PUT", body: JSON.stringify(body), signal }),
    delete: <T>(path: string, signal?: AbortSignal) => 
        request<T>(path, { method: "DELETE", signal }),

    getRaw: <T>(path: string, signal?: AbortSignal) =>
        requestRaw<CommonResponse<T>>(path, { signal }),

    postRaw: <T>(path: string, body: unknown, signal?: AbortSignal) =>
        requestRaw<CommonResponse<T>>(path, { method: "POST", body: JSON.stringify(body), signal }),

    putRaw: <T>(path: string, body: unknown, signal?: AbortSignal) =>
        requestRaw<CommonResponse<T>>(path, { method: "PUT", body: JSON.stringify(body), signal }),

    deleteRaw: <T>(path: string, signal?: AbortSignal) =>
        requestRaw<CommonResponse<T>>(path, { method: "DELETE", signal }),
};

export default baseApi;