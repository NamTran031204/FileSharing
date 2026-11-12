import React from 'react';
import {Tooltip} from 'antd';
import {Copyable} from "@plugin-core/shared/common/display/Copyable";

interface CopyableWrapperProps {
    content: React.ReactNode;
    copyText: string;
    config: {
        copyable?: boolean;
    };
    showTooltip?: boolean;
    tooltipTitle?: string;
    tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
}

export const CopyableWrapper: React.FC<CopyableWrapperProps> = ({
                                                                    content,
                                                                    copyText,
                                                                    config,
                                                                    showTooltip = false,
                                                                    tooltipTitle,
                                                                    tooltipPlacement = 'top',
                                                                }) => {
    const wrappedContent = config.copyable ? (
        <Copyable textToCopy={copyText}>
            {content}
        </Copyable>
    ) : (
        <div className="copyable-text">{content}</div>
    );

    return showTooltip && tooltipTitle ? (
        <Tooltip title={tooltipTitle} placement={tooltipPlacement}>
            {wrappedContent}
        </Tooltip>
    ) : (
        wrappedContent
    );
};
