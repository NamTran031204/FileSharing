import { API_BASE, ApiError, type CommonResponse } from './baseApi';

// Fetch rieng cho guest: khong gui Authorization, khong dung tokenManager.
// Server tra loi trong envelope CommonResponse, ke ca khi HTTP status khong phai 2xx.

export interface ProofLanding {
    folderName: string;
    imageCount: number;
    shareExpiry: string | null;
}

export interface ProofSession {
    guestKey: string;
    guestName: string;
}

export interface ProofAssetItem {
    assetId: string;
    assetName: string;
    thumbnailUrl?: string | null;
    previewUrl?: string | null;
    width?: number | null;
    height?: number | null;
}

export interface ProofAssetPage {
    totalCount: number;
    data: ProofAssetItem[];
}

export interface ProofSubmitResult {
    selectionId: string;
    count: number;
    submittedAt: string;
}

async function call<T>(
    method: 'GET' | 'POST',
    path: string,
    options: { guestKey?: string; body?: unknown } = {},
): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (options.guestKey) {
        headers['X-Guest-Key'] = options.guestKey;
    }

    const res = await fetch(`${API_BASE}/public/proof${path}`, {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    const json = (await res.json().catch(() => null)) as CommonResponse<T> | null;
    if (!json || !res.ok || !json.isSuccessful) {
        throw new ApiError(json?.code ?? 'UNKNOWN_ERROR', json?.message ?? `HTTP ${res.status}`, res.status);
    }
    return json.data;
}

export const proofApi = {
    getLanding: async (shareToken: string): Promise<ProofLanding> => {
        const data = await call<ProofLanding>('GET', `/${encodeURIComponent(shareToken)}`);
        return { ...data, imageCount: Number(data.imageCount) };
    },

    createSession: (shareToken: string, guestName: string) =>
        call<ProofSession>('POST', `/${encodeURIComponent(shareToken)}/sessions`, { body: { guestName } }),

    getAssets: (shareToken: string, guestKey: string, page: number, size: number) =>
        call<ProofAssetPage>(
            'GET',
            `/${encodeURIComponent(shareToken)}/assets?page=${page}&size=${size}`,
            { guestKey },
        ),

    submit: (shareToken: string, guestKey: string, assetIds: string[], note?: string) =>
        call<ProofSubmitResult>('POST', `/${encodeURIComponent(shareToken)}/submit`, {
            guestKey,
            body: { assetIds, note: note?.trim() || undefined },
        }),
};
