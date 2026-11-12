/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import React from 'react';
import {type ColumnType} from "antd/es/table/interface";

export type ColorType = 'success' | 'error' | 'warning' | 'primary' | 'secondary' | 'info' | 'default';

export interface ColorCondition {
    condition: (value: any, record?: any) => boolean;
    color: ColorType;
    backgroundColor?: ColorType;
    fontWeight?: 'normal' | 'bold' | 'bolder' | number;
}

export interface BaseColumnConfig<T = any> extends ColumnType<T> {
    // Color styling
    color?: ColorType | ColorCondition[];
    backgroundColor?: ColorType;
    fontWeight?: 'normal' | 'bold' | 'bolder' | number;
    // Custom styling
    customStyle?: (value: any, record?: any) => React.CSSProperties;
    // Copyable for all types
    copyable?: boolean;
}

// Specific options for each type
export interface NumberColumnOptions extends BaseColumnConfig {
    decimalPlaces?: number;
    thousandSeparator?: string;
    decimalSeparator?: string;
    prefix?: string;
    suffix?: string;
    hideZero?: boolean;
    currency?: boolean;
    valueRender?: (record: any) => number | null;
    colorScheme?: 'default' | 'positive-negative' | 'traffic-light';
    // Tooltip
    showTooltip?: boolean;
    tooltipContent?: string | React.ReactNode;
}

export interface DateColumnOptions extends BaseColumnConfig {
    format?: string;
    showTime?: boolean;
    emptyText?: string;
    showTooltip?: boolean;
    tooltipContent?: string | React.ReactNode;
    tooltipFormat?: string;
    colorScheme?: 'default' | 'age-based' | 'deadline' | 'status';
}

export interface TextColumnOptions extends BaseColumnConfig {
    maxLines?: number;
}

export interface BooleanColumnOptions extends BaseColumnConfig {
    trueText?: string;
    falseText?: string;
    showIcon?: boolean;
}

export interface ImageColumnOptions extends BaseColumnConfig {
    imageWidth?: number;
    imageHeight?: number;
    fallbackSrc?: string;
}

export type NumberColumnConfig = NumberColumnOptions;
export type DateColumnConfig = DateColumnOptions;
export type TextColumnConfig = TextColumnOptions;
export type BooleanColumnConfig = BooleanColumnOptions;
export type ImageColumnConfig = ImageColumnOptions;
export type ColumnConfig = NumberColumnConfig | DateColumnConfig | TextColumnConfig | BooleanColumnConfig | ImageColumnConfig;
