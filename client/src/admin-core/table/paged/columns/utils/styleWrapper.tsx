/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import React from 'react';
import {type BaseColumnConfig, type ColorType} from '../types';

export class StyleWrapper {
    // Color mapping
    static readonly COLOR_MAP: Record<ColorType, string> = {
        success: 'var(--color-success)',
        error: 'var(--color-destructive)',
        warning: 'var(--color-warning)',
        primary: 'var(--vtt-primary)',
        secondary: 'var(--color-muted-foreground)',
        info: 'var(--color-info)',
        default: 'var(--color-foreground)'
    };

    static readonly BACKGROUND_COLOR_MAP: Record<ColorType, string> = {
        success: 'color-mix(in srgb, var(--color-success) 10%, var(--color-card))',
        error: 'color-mix(in srgb, var(--color-destructive) 10%, var(--color-card))',
        warning: 'color-mix(in srgb, var(--color-warning) 10%, var(--color-card))',
        primary: 'color-mix(in srgb, var(--color-info) 10%, var(--color-card))',
        secondary: 'var(--color-background)',
        info: 'color-mix(in srgb, var(--color-info) 10%, var(--color-card))',
        default: 'transparent'
    };

    // Get color based on condition
    static getColorStyle(value: any, record: any, config: BaseColumnConfig): React.CSSProperties {
        let style: React.CSSProperties = {};

        // Handle color conditions
        if (Array.isArray(config.color)) {
            for (const condition of config.color) {
                if (condition.condition(value, record)) {
                    style.color = this.COLOR_MAP[condition.color];
                    if (condition.backgroundColor) {
                        style.backgroundColor = this.BACKGROUND_COLOR_MAP[condition.backgroundColor];
                    }
                    if (condition.fontWeight) {
                        style.fontWeight = condition.fontWeight;
                    }
                    break;
                }
            }
        } else if (config.color) {
            style.color = this.COLOR_MAP[config.color];
        }

        // Handle single background color
        if (config.backgroundColor) {
            style.backgroundColor = this.BACKGROUND_COLOR_MAP[config.backgroundColor];
        }

        // Handle font weight
        if (config.fontWeight) {
            style.fontWeight = config.fontWeight;
        }

        // Handle custom style
        if (config.customStyle) {
            style = {...style, ...config.customStyle(value, record)};
        }

        return style;
    }

    // Wrap content with styling
    static wrapWithStyle(
        content: React.ReactNode,
        value: any,
        record: any,
        config: BaseColumnConfig
    ): React.ReactNode {
        const style = this.getColorStyle(value, record, config);

        if (Object.keys(style).length === 0) {
            return content;
        }

        return (
            <div style={style}>
                {content}
            </div>
        );
    }
}
