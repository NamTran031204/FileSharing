import React from 'react';
import {ConfigProvider, Space} from 'antd';
import {OrdModalCloseButton} from "./buttons/OrdModalCloseButton";

export interface ModalFooterProps {
    left?: React.ReactNode;
    leftClose?: React.ReactNode;
    right?: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    onClose: () => void;
}

export const OrdModalFooter: React.FC<ModalFooterProps> = ({left, leftClose, right, style, className, onClose}) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const hasLeft = !!left;
    return (
        // Figma "Footer popup": nút Medium cao 44 (Button size large theo theme), cách nhau 12.
        // Nút Đóng: Secondary khi đứng một mình, Primary Outline khi có nút chính bên phải.
        <ConfigProvider componentSize="large">
            <div
                className={className}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    ...style,
                }}
            >
                <div>
                    <Space>
                        {left}
                    </Space>
                </div>
                <Space size={12}>
                    {leftClose}
                    <OrdModalCloseButton
                        onClick={onClose}
                        {...(right ? {color: 'primary', variant: 'outlined'} as const : {className: 'btn-other'})}
                    />
                    {right}
                </Space>
            </div>
        </ConfigProvider>
    );
};
