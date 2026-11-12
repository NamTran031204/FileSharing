import React, {useMemo} from "react";
import {Tag} from "antd";
import {useTranslation} from "react-i18next";

interface StatusDisplayProps {
    value?: boolean | null;
    type?: 'tag' | 'badge' | 'text';
    config?: Partial<StatusConfig>;
    className?: string;
}

export interface StatusConfig {
    activeClass: string;
    inactiveClass: string;
    activeText: string;
    inactiveText: string;
    activeColor: string;
    inactiveColor: string;
}

const DEFAULT_STATUS_CONFIG: StatusConfig = {
    activeClass: 'bg-green-100 text-green-800',
    inactiveClass: 'bg-red-100 text-red-800',
    activeText: 'dang_hoat_dong',
    inactiveText: 'ngung_hoat_dong',
    activeColor: 'green',
    inactiveColor: 'red'
};

const getFinalConfig = (config?: Partial<StatusConfig>): StatusConfig => ({
    ...DEFAULT_STATUS_CONFIG,
    ...config
});

// eslint-disable-next-line react-refresh/only-export-components -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
export const getStatusColor = (value: boolean, config?: Partial<StatusConfig>) => {
    const finalConfig = getFinalConfig(config);
    return value ? finalConfig.activeClass : finalConfig.inactiveClass;
};

// eslint-disable-next-line react-refresh/only-export-components -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
export const getStatusTag = (value: boolean, config?: Partial<StatusConfig>) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const {t} = useTranslation('common');
    const finalConfig = getFinalConfig(config);
    // eslint-disable-next-line react-hooks/rules-of-hooks -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const displayText = useMemo(() => {
        const finalConfig = getFinalConfig(config);
        return value ? t(finalConfig.activeText) : t(finalConfig.inactiveText);
    }, [value, config]);
    return (
        <Tag color={value ? finalConfig.activeColor : finalConfig.inactiveColor}>
            {displayText}
        </Tag>
    );
};

export const IsActiveStatusDisplay: React.FC<StatusDisplayProps> = ({
                                                                        value,
                                                                        type = 'tag',
                                                                        config,
                                                                        className = ''
                                                                    }) => {
    const {t} = useTranslation('common');
    const displayText = useMemo(() => {
        const finalConfig = getFinalConfig(config);
        return value ? t(finalConfig.activeText) : t(finalConfig.inactiveText);
    }, [value, config]);

    if (type === 'tag') {
        return getStatusTag(value == true, config);
    }

    if (type === 'badge') {
        return (
            <span
                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value === true, config)} ${className}`}
            >
        {displayText}
      </span>
        );
    }

    if (type === 'text') {
        return (
            <span
                className={`font-medium ${value ? 'text-green-600' : 'text-red-600'} ${className}`}
            >
        {displayText}
      </span>
        );
    }

    // Fallback
    return getStatusTag(value == true, config);
};
