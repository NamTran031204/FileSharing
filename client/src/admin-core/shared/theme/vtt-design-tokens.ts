const read = (name: string, fallback: string) => {
    if (typeof document === 'undefined') return fallback;
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
};

export const vttDesignTokens = {
    color: {
        get borderStrong() {
            return read('--color-border', 'currentColor');
        },
    },
};
