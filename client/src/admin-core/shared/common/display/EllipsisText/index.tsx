import React from 'react';
import type {TooltipProps} from 'antd';
import {Tooltip} from 'antd';
import './index.css';

interface EllipsisTextProps {
    text: string;
    maxLines?: number;
    width?: string;
    minWidth?: string;
    className?: string;
    // Ant Design Tooltip props
    tooltipProps?: Omit<TooltipProps, 'title' | 'children'>;
    // Additional options
    disabled?: boolean; // Disable tooltip completely
    customTooltipContent?: React.ReactNode; // Custom tooltip content
}

export const EllipsisText: React.FC<EllipsisTextProps> = ({
                                                              text,
                                                              maxLines = 2,
                                                              width = '100%',
                                                              minWidth = '100px',
                                                              className = '',
                                                              tooltipProps = {},
                                                              disabled = false,
                                                              customTooltipContent
                                                          }) => {
    const textRef = React.useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = React.useState<boolean>(false);

    const checkOverflow = React.useCallback(() => {
        const element = textRef.current;
        if (element) {
            const isTextOverflowing = element.scrollHeight > element.clientHeight;
            setIsOverflowing(isTextOverflowing);
        }
    }, []);

    React.useEffect(() => {
        checkOverflow();
    }, [text, maxLines, checkOverflow]);

    // Theo dõi thay đổi kích thước màn hình
    React.useEffect(() => {
        const handleResize = () => {
            checkOverflow();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [checkOverflow]);

    // Text element
    const textElement = (
        <div
            ref={textRef}
            className={`ellipsis-text ${isOverflowing ? 'overflow' : 'no-overflow'} ${className}`}
            style={{
                width: width,
                WebkitLineClamp: maxLines,
                minWidth: minWidth
            }}
        >
            {text}
        </div>
    );

    // If tooltip is disabled or text is not overflowing, return text without tooltip
    if (disabled || !isOverflowing) {
        return <div className="ellipsis-text-container">{textElement}</div>;
    }

    // Tooltip content - use custom content if provided, otherwise use original text
    const tooltipContent = customTooltipContent || text;

    return (
        <div className="ellipsis-text-container">
            <Tooltip
                title={tooltipContent}
                placement="top"
                trigger="hover"
                overlayStyle={{maxWidth: '400px'}}
                {...tooltipProps}
            >
                {textElement}
            </Tooltip>
        </div>
    );
};