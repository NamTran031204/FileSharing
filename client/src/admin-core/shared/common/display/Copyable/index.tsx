import React, {useState} from 'react';
import './index.css';
import {message} from 'antd';
import {CheckOutlined, CopyOutlined} from '@ant-design/icons';
import classNames from 'classnames';
import {useTranslation} from "react-i18next";

export const CopySvgIcon: React.FC = () => (
    <CopyOutlined style={{fontSize: 16}}/>
);

interface CopyableProps {
    textToCopy?: string | null;
    children?: React.ReactNode;
    className?: string;
    successMessage?: string;
    errorMessage?: string;
}

export const Copyable: React.FC<CopyableProps> = ({
                                                      textToCopy, children, className,
                                                      successMessage = 'Đã sao chép!',
                                                      errorMessage = 'Không thể sao chép',
                                                  }) => {
    const [copied, setCopied] = useState(false);
    const {t} = useTranslation();
    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(textToCopy || '');
            setCopied(true);
            message.success(t(successMessage));
            setTimeout(() => setCopied(false), 2000);
        } catch {
            message.success(t(errorMessage));
        }
    };

    return (
        <div className={classNames('copyable-wrapper', className)} onClick={handleCopy}>
            <div className="copyable-text">{children || textToCopy}</div>
            {
                (children || textToCopy)
                && <span className={classNames('copy-icon', {copied})}>
                {copied ? <CheckOutlined/> : <CopySvgIcon/>}
            </span>
            }

        </div>
    );
};
