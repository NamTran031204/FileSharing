export interface DateDisplayConfig {
    // ======================== BASIC FORMATTING ========================

    /**
     * Custom date format string using dayjs format tokens
     * @example 'DD/MM/YYYY' → '25/12/2024'
     * @example 'DD-MM-YYYY HH:mm' → '25-12-2024 14:30'
     * @example 'dddd, MMMM Do YYYY' → 'Wednesday, December 25th 2024'
     * @example 'YYYY-MM-DD' → '2024-12-25' (ISO format)
     * @example 'h:mm A' → '2:30 PM' (12-hour format)
     * @see https://day.js.org/docs/en/display/format
     * @default undefined (uses mode-specific default)
     */
    format?: string;

    /**
     * Whether to display time component along with date
     * @example true → '25/12/2024 14:30'
     * @example false → '25/12/2024'
     * @default true for datetime mode, false for date mode
     */
    showTime?: boolean;

    /**
     * Whether to include seconds in time display
     * Only takes effect when showTime is true
     * @example true → '25/12/2024 14:30:45'
     * @example false → '25/12/2024 14:30'
     * @default false
     */
    showSeconds?: boolean;

    /**
     * Whether to display timezone information
     * @example true → '25/12/2024 14:30 (+07:00)' or '25/12/2024 14:30 (ICT)'
     * @example false → '25/12/2024 14:30'
     * @default false
     */
    showTimeZone?: boolean;

    // ======================== LOCALIZATION ========================

    /**
     * Locale for date formatting (BCP 47 language tag)
     * Affects month names, day names, and number formatting
     * @example 'vi-VN' → 'Thứ Tư, 25 tháng 12, 2024'
     * @example 'en-US' → 'Wednesday, December 25, 2024'
     * @example 'ja-JP' → '2024年12月25日水曜日'
     * @example 'fr-FR' → 'mercredi 25 décembre 2024'
     * @default 'vi-VN'
     */
    locale?: string;

    /**
     * Target timezone for date display (IANA timezone identifier)
     * Converts the date to the specified timezone before formatting
     * @example 'Asia/Ho_Chi_Minh' → UTC+7
     * @example 'America/New_York' → UTC-5 (EST) or UTC-4 (EDT)
     * @example 'Europe/London' → UTC+0 (GMT) or UTC+1 (BST)
     * @example 'Asia/Tokyo' → UTC+9
     * @default undefined (uses local timezone)
     */
    timeZone?: string;

    // ======================== RELATIVE TIME DISPLAY ========================

    /**
     * Enable relative time display for recent dates
     * When enabled, shows human-readable relative time instead of absolute date
     * @example true + recent date → 'vừa xong', '5 phút trước', '2 ngày trước'
     * @example false → always shows absolute date '25/12/2024 14:30'
     * Works in combination with relativeThreshold
     * @default false
     */
    relative?: boolean;

    /**
     * Number of days threshold for switching between relative and absolute display
     * Only applies when relative is true
     * - If date difference ≤ threshold: show relative time
     * - If date difference > threshold: show absolute date using format
     * @example 1 → only today/yesterday shows as relative
     * @example 7 → dates within a week show as relative
     * @example 30 → dates within a month show as relative
     * @default 7 (one week)
     */
    relativeThreshold?: number;

    // ======================== CALENDAR DISPLAY ========================

    /**
     * Enable calendar-style display for recent dates
     * Shows contextual time references instead of exact dates
     * @example true → 'Today at 2:30 PM', 'Yesterday at 10:00 AM', 'Last Monday at 9:15 AM'
     * @example false → '25/12/2024 14:30'
     * More specific than relative time, provides exact context
     * @default false
     */
    calendar?: boolean;

    // ======================== INTL.DATETIMEFORMAT STYLES ========================

    /**
     * Predefined date formatting style using Intl.DateTimeFormat
     * Automatically localizes based on locale setting
     * Takes precedence over custom format when specified
     * @example 'full' → 'Wednesday, December 25, 2024' (en-US) | 'Thứ Tư, 25 tháng 12, 2024' (vi-VN)
     * @example 'long' → 'December 25, 2024' (en-US) | '25 tháng 12, 2024' (vi-VN)
     * @example 'medium' → 'Dec 25, 2024' (en-US) | '25 thg 12, 2024' (vi-VN)
     * @example 'short' → '12/25/24' (en-US) | '25/12/24' (vi-VN)
     * @default undefined
     */
    dateStyle?: 'full' | 'long' | 'medium' | 'short';

    /**
     * Predefined time formatting style using Intl.DateTimeFormat
     * Automatically localizes based on locale setting
     * Only takes effect when showTime is true
     * @example 'full' → '2:30:45 PM Indochina Time' (en-US) | '14:30:45 Giờ Đông Dương' (vi-VN)
     * @example 'long' → '2:30:45 PM ICT' (en-US) | '14:30:45 ICT' (vi-VN)
     * @example 'medium' → '2:30:45 PM' (en-US) | '14:30:45' (vi-VN)
     * @example 'short' → '2:30 PM' (en-US) | '14:30' (vi-VN)
     * @default undefined
     */
    timeStyle?: 'full' | 'long' | 'medium' | 'short';

    // ======================== ERROR HANDLING ========================

    /**
     * Text to display when date value is null, undefined, or empty string
     * @example '--' → shows '--' for empty values
     * @example 'Chưa có' → shows 'Chưa có' for empty values
     * @example '' → shows empty string for empty values
     * @default '--'
     */
    emptyText?: string;

    /**
     * Text to display when date value is invalid or cannot be parsed
     * @example 'Invalid Date' → shows 'Invalid Date' for malformed dates
     * @example 'Ngày không hợp lệ' → shows Vietnamese error message
     * @example '❌' → shows error icon
     * @default 'Invalid Date'
     */
    invalidText?: string;
}

export interface DateDisplayProps extends DateDisplayConfig {
    value: string | Date | number | null | undefined;
    className?: string;
    style?: React.CSSProperties;
    // Display modes
    mode?: 'date' | 'time' | 'datetime' | 'relative' | 'calendar' | 'fromNow' | 'duration';
    // Color scheme based on date ranges
    colorScheme?: 'default' | 'age-based' | 'deadline' | 'status';
    deadlineDate?: string | Date;
    // Tooltip
    showTooltip?: boolean;
    tooltipContent?: string | React.ReactNode;
    tooltipFormat?: string;
    // Loading state
    loading?: boolean;
    skeleton?: boolean;
    // Icon
    showIcon?: boolean;
    icon?: React.ReactNode;
}