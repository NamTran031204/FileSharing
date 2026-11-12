import React from 'react';
import {Button, type ButtonProps} from 'antd';
import type {SizeType} from "antd/es/config-provider/SizeContext";
import {useTranslation} from "react-i18next";

export interface CloseButtonProps {
    onClick?: () => void;
    size?: SizeType;
    style?: React.CSSProperties;
    className?: string;
    color?: ButtonProps['color'];
    variant?: ButtonProps['variant'];
}

export const OrdModalCloseButton: React.FC<CloseButtonProps> = ({
                                                                    onClick,
                                                                    size,
                                                                    style,
                                                                    className,
                                                                    color,
                                                                    variant,
                                                                }) => {
    const {t} = useTranslation(['action']);
    return (
        <Button
            onClick={onClick}
            size={size}
            style={style}
            className={className}
            color={color}
            variant={variant}
        >
            {t('modal.cancel')}
        </Button>
    );
};
