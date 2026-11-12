/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {useMemo} from "react";
import {debounce, throttle} from "lodash";

export function useDebouncedCallback<T extends (...args: any[]) => void>(
    callback: T,
    delay = 300
) {
    return useMemo(() => debounce(callback, delay), [callback, delay]);
}

export function useThrottleCallback<T extends (...args: any[]) => void>(
    callback: T,
    delay = 300
) {
    return useMemo(() => throttle(callback, delay), [callback, delay]);
}