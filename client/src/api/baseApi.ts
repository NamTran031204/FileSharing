const API_BASE = "http://localhost:8080/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...init,
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }

    if (res.status === 204) return undefined as unknown as T;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return (await res.json()) as T;
    } else {
        return (await res.text()) as T;
    }
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
};

export default baseApi;