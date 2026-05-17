import { Grid } from "antd";

// xs  < 576px
// sm  ≥ 576px
// md  ≥ 768px
// lg  ≥ 992px
// xl  ≥ 1200px
// xxl ≥ 1600px

const useBreakpoints = () => Grid.useBreakpoint();

export const useIsMobile = (): boolean => !useBreakpoints().md;       // < 768px
export const useIsTablet = (): boolean => {
    const bp = useBreakpoints();
    return !!bp.md && !bp.lg;                                          // 768–991px
};
export const useIsDesktop = (): boolean => !!useBreakpoints().lg;     // ≥ 992px
export const useIsLargeDesktop = (): boolean => !!useBreakpoints().xl; // ≥ 1200px
export const useIsXLargeDesktop = (): boolean => !!useBreakpoints().xxl; // ≥ 1600px

export const useScreenSize = () => {
    const bp = useBreakpoints();
    return {
        isXs: !bp.sm,
        isSm: !!bp.sm && !bp.md,
        isMd: !!bp.md && !bp.lg,
        isLg: !!bp.lg && !bp.xl,
        isXl: !!bp.xl && !bp.xxl,
        isXxl: !!bp.xxl,
        isMobile: !bp.md,
        isTablet: !!bp.md && !bp.lg,
        isDesktop: !!bp.lg,
    };
};
