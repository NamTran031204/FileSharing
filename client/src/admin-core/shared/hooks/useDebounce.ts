/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {useEffect, useMemo} from 'react';
import {debounce} from "lodash";

export const useDebounce = (callback: () => void, delay: number, deps: any[]) => {
    const debouncedCallback = useMemo(
        () => debounce(callback, delay),
        [callback, delay]
    );

    useEffect(() => {
        return () => {
            debouncedCallback.cancel();
        };
    }, [debouncedCallback]);

    useEffect(() => {
        debouncedCallback();
    }, deps);
};
