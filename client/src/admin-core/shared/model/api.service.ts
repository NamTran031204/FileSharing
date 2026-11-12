/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
export type ApiCommonResultDto<T> = {
    code?: string;
    message?: string;
    data?: T;
    extend?: any | null;
    isSuccessful?: boolean;
};
export type FetchDetailById<T> = (params: {
    body?: {
        encodedId?: string;
    }
}) => Promise<ApiCommonResultDto<T>>;