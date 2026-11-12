/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import React from "react";

/**
 * Core CRUD Types
 *
 * Shared types dùng chung cho tất cả entity CRUD trong plugin.
 * Plugin chỉ cần định nghĩa entity-specific DTOs, không cần lặp lại các wrapper types.
 */

// ============================================================================
// Action Button
// ============================================================================

export interface IActionBtn {
    title?: 'addNew' | 'exportExcel' | string;
    icon?: React.ReactNode;
    onClick?: () => void;
    permission?: string;
    content?: React.ReactNode;
}

// ============================================================================
// Response Wrappers (dùng chung - không cần define lại trong plugin)
// ============================================================================

export interface CommonResultDto<T> {
    isSuccessful?: boolean;
    code?: string;
    message?: string;
    data?: T;
    extend?: any | null;
    errorDetail?: { code?: string; message?: string; data?: any };
    notification?: { code?: string; message?: string; data?: any };
    errors?: { propertyName?: string; errorMessage?: string; errorCode?: string }[];
}

export interface PagedResultDto<T> {
    items?: T[];
    totalCount?: number | string | null;
}

export interface ComboOptionDto {
    value?: any;
    label?: string;
    text?: string;
    displayName?: string;
    fts?: string;
    data?: any;
}

export interface CounterByStatusItemDto {
    statusValue?: any | null;
    statusDescription?: string;
    totalCount?: number;
    isTotalItem?: boolean;
    status?: boolean | string;
    count?: number;
    label?: string;
}

// ============================================================================
// Common Input DTOs
// ============================================================================

export interface EncodedIdDto {
    id?: number | string;
    encodedId?: string;
}

export interface SetActiveStatusDto {
    id?: number | string;
    encodedId?: string;
    isActived?: boolean;
}

export interface GetComboOptionInputDto {
    includeUnActive?: boolean;
}

export interface PagedInput {
    filter?: string;
    isActived?: boolean | null;
    skipCount?: number;
    maxResultCount?: number;
    sorting?: string;
}

// ============================================================================
// ICrudService - Generic CRUD Service Interface
// ============================================================================

/**
 * Interface chung cho tất cả CRUD API services.
 *
 * Plugin entity chỉ cần:
 * - Import interface này
 * - Assign generated service hoặc mock service
 *
 * Compatible với cả generated API services (gen-api) và custom services.
 */
export interface ICrudService<
    TPagedDto = any,
    TDetailDto = any,
    TCreateDto = any,
    TUpdateDto = any,
    TPagedInput extends PagedInput = PagedInput
> {
    getPaged(params: { body?: TPagedInput }): Promise<CommonResultDto<PagedResultDto<TPagedDto>>>;
    getById?(params: { body?: EncodedIdDto }): Promise<CommonResultDto<TDetailDto>>;
    create(params: { body?: TCreateDto }): Promise<CommonResultDto<TDetailDto>>;
    update(params: { body?: TUpdateDto }): Promise<CommonResultDto<TDetailDto>>;
    remove?(params: { body?: EncodedIdDto }): Promise<CommonResultDto<any>>;
    setActiveStatus?(params: { body?: SetActiveStatusDto }): Promise<CommonResultDto<boolean>>;
    getCountByActive?(params: { body?: TPagedInput }): Promise<CommonResultDto<CounterByStatusItemDto[]>>;
    getComboOptions?(params: { body?: GetComboOptionInputDto }): Promise<CommonResultDto<ComboOptionDto[]>>;
    exportToExcel?(params: { body?: TPagedInput }): Promise<any>;
}
