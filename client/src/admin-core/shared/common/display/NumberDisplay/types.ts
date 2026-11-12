export interface NumberDisplayConfig {
    decimalPlaces?: number;
    thousandSeparator?: string;
    decimalSeparator?: string;
    prefix?: string;
    suffix?: string;
    currency?: boolean;
    hideZero?: boolean;
    locale?: string;
    currencyCode?: string;
    // Formatting styles
    notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
}

export interface NumberDisplayProps extends NumberDisplayConfig {
    value: number | string | null | undefined;
    className?: string;
    style?: React.CSSProperties;
    // Display options
    showSign?: boolean; // +/- signs
    showPercentage?: boolean;
    abbreviate?: boolean; // 1K, 1M, 1B
    colorScheme?: 'default' | 'positive-negative' | 'traffic-light';
    // Tooltip
    showTooltip?: boolean;
    tooltipContent?: string | React.ReactNode;
    // Loading state
    loading?: boolean;
    skeleton?: boolean;
}

// 2. src/components/common/NumberDisplay/utils.ts
export class NumberFormatUtils {
    // Format number with options
    static formatNumber(value: number, config: NumberDisplayConfig): string {
        const {
            decimalPlaces = 0,
            thousandSeparator = ',',
            decimalSeparator = '.',
            prefix = '',
            suffix = '',
            currency = false,
            locale,
            currencyCode = 'VND',
            notation = 'standard',
            minimumFractionDigits,
            maximumFractionDigits
        } = config;

        // Use Intl.NumberFormat for advanced formatting
        if (locale || notation !== 'standard' || currency) {
            const options: Intl.NumberFormatOptions = {
                notation,
                minimumFractionDigits: minimumFractionDigits ?? decimalPlaces,
                maximumFractionDigits: maximumFractionDigits ?? decimalPlaces,
            };

            if (currency) {
                options.style = 'currency';
                options.currency = currencyCode;
            }

            return new Intl.NumberFormat(locale || 'vi-VN', options).format(value);
        }

        // Custom formatting
        let formatted = value.toFixed(decimalPlaces);

        // Replace decimal separator
        if (decimalSeparator !== '.') {
            formatted = formatted.replace('.', decimalSeparator);
        }

        // Add thousand separators
        const parts = formatted.split(decimalSeparator);
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
        formatted = parts.join(decimalSeparator);

        // Add prefix/suffix
        if (currency) {
            return `${prefix}${formatted}${suffix || ' VND'}`;
        }

        return `${prefix}${formatted}${suffix}`;
    }

    // Abbreviate large numbers (1K, 1M, 1B)
    static abbreviateNumber(value: number): string {
        const suffixes = ['', 'K', 'M', 'B', 'T'];
        const tier = Math.log10(Math.abs(value)) / 3 | 0;

        if (tier === 0) return value.toString();

        const suffix = suffixes[tier];
        const scale = Math.pow(10, tier * 3);
        const scaled = value / scale;

        return scaled.toFixed(1) + suffix;
    }

    // Get color based on value and scheme
    static getValueColor(value: number, scheme: string): string {
        switch (scheme) {
            case 'positive-negative':
                return value > 0 ? 'var(--color-success)' : value < 0 ? 'var(--color-destructive)' : 'var(--color-muted-foreground)';

            case 'traffic-light':
                return value >= 80 ? 'var(--color-success)' : value >= 60 ? 'var(--color-warning)' : 'var(--color-destructive)';

            default:
                return 'inherit';
        }
    }

    // Format with sign
    static formatWithSign(value: number, formatted: string): string {
        if (value > 0) return `+${formatted}`;
        return formatted; // Negative sign already included
    }
}