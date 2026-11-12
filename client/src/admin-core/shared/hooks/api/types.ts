/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import React from "react";
import {type ApiCommonResultDto} from "@plugin-core/shared/model/api.service";

export interface ApiHandlerOptions<TBody = any, TResult = any> {
    apiCall: (body: TBody) => Promise<ApiCommonResultDto<TResult>>;
    onSuccess: (resultData?: TResult, body?: TBody) => void;
    onError?: (resultData?: TResult, body?: TBody) => void;
    onFinally?: () => void;
    successMessage?: string;
    successMessageFn?: (resultData?: TResult, body?: TBody) => string | React.ReactNode;
    errorMessage?: string;
    errorMessageFn?: (resultData?: TResult, body?: TBody) => string;
    isSuccessFromResult?: boolean;
    isErrorFromResult?: boolean;
    isBusyUi?: boolean;
}
