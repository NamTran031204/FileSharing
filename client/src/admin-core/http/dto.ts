/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
export interface CommonResultExtendDto {
    code?: string | undefined;
    message?: string | undefined;
    data?: any | undefined;
}

export interface ValidateInputDto {
    propertyName?: string | undefined;
    errorMessage?: string | undefined;
    errorCode?: string | undefined;
}

export interface CommonResultDto<T> {
    isSuccessful?: boolean;
    errorDetail?: CommonResultExtendDto;
    notification?: CommonResultExtendDto;
    errors?: ValidateInputDto[] | undefined;
    data?: T;
    code?: string;
    message?: string;
    extend?: any | null;
}

export interface PagedResultDto<T> {
    items?: T[] | undefined;
    totalCount?: number | string | null;
    [props: string]: any // Add this line to allow any other properties
}

export interface ComboOptionDto {
    value?: any | undefined;
    displayName?: string | undefined;
    data?: any | undefined;
}

export interface PagedRequestDto {
    maxResultCount?: number;
    skipCount?: number;
    sorting?: string | undefined;
    filter?: string | undefined;
    isActived?: boolean | undefined;
    export?: OrdExportPaged;
}

export interface OrdExportPaged {
    title?: string;
    columnNames?: string[];
}
