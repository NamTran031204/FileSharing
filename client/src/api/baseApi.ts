export const API_BASE = "http://localhost:8080/api";

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

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const tokenManager = {
    getAccessToken: (): string | null => {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    },

    getRefreshToken: (): string | null => {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },

    setTokens: (accessToken: string, refreshToken: string): void => {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    },

    clearTokens: (): void => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem(ACCESS_TOKEN_KEY);
    }
};

function createHeaders(customHeaders?: HeadersInit): Headers {
    const headers = new Headers({
        'Content-Type': 'application/json',
        ...customHeaders
    });

    const token = tokenManager.getAccessToken();
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
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
    const url = `${API_BASE}${path}`;
    const headers = createHeaders(init?.headers as HeadersInit);

    const res = await fetch(url, {
        ...init,
        headers
    });

    if (!res.ok) {
        if (res.status === 401) {
            tokenManager.clearTokens();
            // Có thể dispatch event hoặc redirect
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        const errorData = await res.json().catch(() => ({}));
        throw new ApiError(
            errorData.code || 'UNKNOWN_ERROR',
            errorData.message || `HTTP ${res.status}`,
            res.status
        );
    }

    return res.json();
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await requestRaw<CommonResponse<T>>(path, init);

    if (!response.isSuccessful) {
        throw new ApiError(response.code, response.message);
    }

    return response.data;
}

const baseApi = {
    get: <T>(path: string, signal?: AbortSignal) =>
        request<T>(path, {signal}),
    post: <T>(path: string, body: unknown, signal?: AbortSignal) =>
        request<T>(path, {method: "POST", body: JSON.stringify(body), signal}),
    put: <T>(path: string, body: unknown, signal?: AbortSignal) =>
        request<T>(path, {method: "PUT", body: JSON.stringify(body), signal}),
    delete: <T>(path: string, signal?: AbortSignal) =>
        request<T>(path, {method: "DELETE", signal}),

    getRaw: <T>(path: string, signal?: AbortSignal) =>
        requestRaw<CommonResponse<T>>(path, {signal}),

    postRaw: <T>(path: string, body: unknown, signal?: AbortSignal) =>
        requestRaw<CommonResponse<T>>(path, {method: "POST", body: JSON.stringify(body), signal}),

    putRaw: <T>(path: string, body: unknown, signal?: AbortSignal) =>
        requestRaw<CommonResponse<T>>(path, {method: "PUT", body: JSON.stringify(body), signal}),

    deleteRaw: <T>(path: string, signal?: AbortSignal) =>
        requestRaw<CommonResponse<T>>(path, {method: "DELETE", signal}),
};

export default baseApi;