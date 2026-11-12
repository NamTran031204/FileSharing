import {Button} from "antd";
import React, {forwardRef, useMemo} from "react";
import {type ButtonProps} from "antd/es/button/Button";
import {debounce, throttle} from "lodash";

interface Props extends ButtonProps {
    onClick?: (e: React.MouseEvent<HTMLElement>) => void;
    delay?: number;
    isThrottle?: boolean;
}

export const OrdButtonDebounced = forwardRef<HTMLButtonElement, Props>(
    ({
         onClick,
         delay = 300,
         isThrottle = false,
         ...btnProps
     }, ref) => {
        // debounce version
        const debouncedClick = useMemo(
            () =>
                debounce(
                    (e: React.MouseEvent<HTMLElement>) => {
                        onClick?.(e);
                    },
                    delay
                ),
            [onClick, delay]
        );

        // throttle version
        const throttleClick = useMemo(
            () =>
                throttle(
                    (e: React.MouseEvent<HTMLElement>) => {
                        onClick?.(e);
                    },
                    delay,
                    {trailing: false}
                ),
            [onClick, delay]
        );

        return (
            <Button
                ref={ref}
                {...btnProps}
                onClick={(e) => {
                    if (isThrottle) {
                        throttleClick(e);
                    } else {
                        debouncedClick(e);
                    }
                }}
            />
        );
    }
);

OrdButtonDebounced.displayName = "OrdButtonDebounced";
