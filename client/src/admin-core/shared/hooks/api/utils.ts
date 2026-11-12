/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import React from "react";
import Utils from "@plugin-core/shared/utils/utils";
import {l} from "@plugin-core/shared/language/lang.utils";
import uiUtils from "@plugin-core/shared/utils/ui.utils";
import {type ApiCommonResultDto} from "@plugin-core/shared/model/api.service";

// ===== Type definitions =====
export interface ApiSuccessMessageOptions {
    successMessage?: string;
    successMessageFn?: (resultData?: any, body?: any) => string | React.ReactNode;
    isSuccessFromResult?: boolean;
}

export interface ApiErrorMessageOptions {
    errorMessage?: string;
    errorMessageFn?: (resultData?: any, body?: any) => string;
    isErrorFromResult?: boolean;
}

export type ApiMessageOptions = ApiSuccessMessageOptions & ApiErrorMessageOptions;

const isPlainObject = (obj: unknown): obj is Record<string, any> =>
    obj != null && typeof obj === "object" && obj.constructor === Object;

function buildPayload<TBody, TResult>(body?: TBody, resultData?: TResult) {
    if (!body && !resultData) return {};
    if (!body) return resultData;
    if (!resultData) return body;

    return isPlainObject(resultData)
        ? {...body, ...(resultData as object)}
        : {...body, resultData};
}

function buildMessageFromApi<TResult, TBody>(
    apiMessage?: string,
    resultData?: TResult,
    body?: TBody
) {
    if (Utils.isNullOrEmpty(apiMessage)) return undefined;
    return l.trans("api-notify." + apiMessage, buildPayload(body, resultData));
}


export function showMessage<TBody, TResult>(
    type: "success" | "error",
    body: TBody | undefined,
    resultApi: ApiCommonResultDto<TResult>,
    opts: {
        message?: string;
        messageFn?: (resultData?: any, body?: any) => string | React.ReactNode;
        fromResult: boolean;
    }
) {
    const {data: resultData, message: apiMessage} = resultApi;
    const payload = buildPayload(body, resultData);
    const uiShow = type === "success" ? uiUtils.showSuccess : uiUtils.showError;

    if (opts.messageFn) {
        const fnResult = opts.messageFn(resultData, body);
        uiShow(fnResult as any);
    } else if (opts.message) {
        uiShow(l.trans("api-notify." + opts.message, payload));
    }

    if (opts.fromResult) {
        const messageFromApi = buildMessageFromApi(apiMessage, resultData, body);
        if (messageFromApi) uiShow(messageFromApi);
    }
}

export const showSuccessMessage = <TBody, TResult>(
    body: TBody | undefined,
    resultApi: ApiCommonResultDto<TResult>,
    opts: ApiSuccessMessageOptions
) =>
    showMessage("success", body, resultApi, {
        message: opts.successMessage,
        messageFn: opts.successMessageFn,
        fromResult: Boolean(opts.isSuccessFromResult)
    });

export const showErrorMessage = <TBody, TResult>(
    body: TBody | undefined,
    resultApi: ApiCommonResultDto<TResult>,
    opts: ApiErrorMessageOptions
) =>
    showMessage("error", body, resultApi, {
        message: opts.errorMessage,
        messageFn: opts.errorMessageFn,
        fromResult: Boolean(opts.isErrorFromResult)
    });

export const showNotifyMessageApiResult = <TBody, TResult>(
    resultApi: ApiCommonResultDto<TResult>,
    opts: ApiMessageOptions,
    body?: TBody
) => {
    if (resultApi.isSuccessful) {
        showSuccessMessage(body, resultApi, opts);
    } else {
        showErrorMessage(body, resultApi, opts);
    }
};
