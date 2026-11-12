/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import uiUtils from "@plugin-core/shared/utils/ui.utils";
import {type ApiHandlerOptions} from "./types";
import {showNotifyMessageApiResult} from "./utils";

export function useApiHandler() {
    async function handleCallApi<TBody, TResult = any>(
        body: TBody,
        options: ApiHandlerOptions<TBody, TResult>
    ) {
        const {
            apiCall,
            onSuccess,
            onError,
            onFinally,
            successMessage,
            errorMessage,
            successMessageFn,
            errorMessageFn,
            isSuccessFromResult = false,
            isErrorFromResult = true,
            isBusyUi = true
        } = options;

        if (isBusyUi) uiUtils.setBusy();

        try {
            const result = await apiCall(body);
            showNotifyMessageApiResult(result, {
                successMessage,
                errorMessage,
                successMessageFn,
                errorMessageFn,
                isSuccessFromResult,
                isErrorFromResult,
            }, body);
            if (result.isSuccessful) {
                onSuccess?.(result.data, body);
                return true;
            } else {
                onError?.(result.data, body);
                return false;
            }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
        } catch (err) {
            uiUtils.showError("Có lỗi xảy ra khi thực hiện yêu cầu");
            return false;
        } finally {
            onFinally?.();
            if (isBusyUi) uiUtils.clearBusy();
        }
    }

    return {handleCallApi};
}
