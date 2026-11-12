export const ResponsivePresets = {
    // Auto-responsive based on column width
    auto: {
        responsive: true,
        charWidth: 8,
        minChars: 20,
        maxChars: 1000
    },

    // Dynamic based on content importance
    dynamic: (importance: 'high' | 'medium' | 'low') => ({
        responsive: true,
        dynamicLength: (containerWidth: number, columnWidth: number) => {
            const baseLength = Math.floor(columnWidth / 8);
            const multiplier = importance === 'high' ? 1.5 : importance === 'medium' ? 1.0 : 0.7;
            return Math.floor(baseLength * multiplier);
        }
    })
};
