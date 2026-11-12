import {useMemo} from 'react';
import {type ColProps} from "antd/es/grid/col";

export const useResponsiveSpan = (
    width: number,
    disableResponsive?: boolean
): ColProps => {
    return useMemo(() => {
        if (disableResponsive) {
            return {
                span: width
            };
        }

        const getResponsiveSpan = (): ColProps => {
            // Dựa trên width mong muốn cho XL (tham số truyền vào), và scale dần cho các breakpoint khác
            const xl = width;
            const lg = width <= 8 ? 8 : width <= 12 ? 12 : width <= 16 ? 16 : 24;
            const md = width >= 16 ? 24 : 12;
            const sm = 24;
            const xs = 24;
            const xxl = width >= 24 ? 24 : xl; // fallback

            return {
                span: 24,
                xs,
                sm,
                md,
                lg,
                xl,
                xxl,
            };
        };

        return getResponsiveSpan();
    }, [width, disableResponsive]);
};
