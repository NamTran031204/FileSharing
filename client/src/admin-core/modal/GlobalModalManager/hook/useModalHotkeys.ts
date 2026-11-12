/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {useHotkeys} from 'react-hotkeys-hook';
import {useGlobalModalStore} from './useGlobalModalStore';
import {useEffect, useMemo} from 'react';
import debounce from 'lodash/debounce';

interface HotKeyHandlerConfig {
    handler: () => void;
    debounceTime?: number; // tính bằng ms
}

interface UseModalHotkeysOptions {
    modalId: string;
    ignoreHotKeys?: string[];
    onHandlerHotKey: { [key: string]: HotKeyHandlerConfig };
}

export const useModalHotkeys = ({
                                    modalId,
                                    ignoreHotKeys = [],
                                    onHandlerHotKey
                                }: UseModalHotkeysOptions) => {
    const topModalId = useGlobalModalStore(state => state.topModalId);
    const isTop = topModalId === modalId;

    const processedHandlers = useMemo(() => {
        const map: { [key: string]: () => void } = {};
        Object.entries(onHandlerHotKey).forEach(([key, config]) => {
            if (config?.debounceTime) {
                map[key] = debounce(config.handler, config.debounceTime, {
                    leading: true,
                    trailing: false
                });
            } else {
                map[key] = config.handler;
            }
        });
        return map;
    }, [onHandlerHotKey]);

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            Object.entries(onHandlerHotKey).forEach(([key, config]) => {
                if (config?.debounceTime) {
                    const fn = processedHandlers[key] as any;
                    fn?.cancel?.();
                }
            });
        };
    }, [processedHandlers, onHandlerHotKey]);

    Object.entries(processedHandlers).forEach(([key, handler]) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
        useHotkeys(
            key,
            (event) => {
                if (isTop) {
                    handler?.();
                    event.preventDefault();
                }
            },
            {
                enableOnFormTags: true,
                enabled: isTop && !ignoreHotKeys.includes(key)
            },
            [isTop, handler, ignoreHotKeys]
        );
    });

};
