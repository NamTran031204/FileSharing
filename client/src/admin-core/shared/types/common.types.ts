/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {type AxiosRequestConfig} from "axios";

export interface IRequestOptions extends AxiosRequestConfig {
    loading?: boolean;
    showError?: boolean;
    security?: Record<string, 'md5' | 'sha1' | 'aes' | 'des'>;
    withAuthorization?: boolean;
}

export interface DateRangeDto {
    autoSetTimeStartEnd?: boolean;
    startDate?: Date;
    endDate?: Date;
}

export interface EncodedIdDto {
    encodedId?: string;
}

export interface CounterByIsActivedStatusDto {
    totalTrue?: number;
    totalFalse?: number;
    total?: number;
}

export interface FileUploadDto {
    fileName?: string;
    fileId?: string;
    mimeType?: string;
    bytes?: string;
    blobContainerPath?: string;
    absPath?: string;
}

export interface ComboOptionDto {
    value?: any | null;
    displayName?: string;
    disabled?: boolean;
    data?: any | null;
}

export interface OrdThemeDto {
    themeInfo?: string;
    logoFull?: string;
    logoSimple?: string;
    copyright?: string;
    systemName?: string;
    descriptionPage?: string;
    faviconIco?: string;
    bgLoginLeft?: string;
    bgLoginUnder?: string;
    landingPageUrl?: string;
    dashboardSlider?: string[];
    dashboardSlider1?: string;
    dashboardSlider2?: string;
    dashboardSlider3?: string;
    dashboardSlider4?: string;
    dashboardSlider5?: string;
}

export interface UserInformationDto {
    id?: string;
    userName?: string;
    email?: string;
    phoneNumber?: string;
    name?: string;
    level?: string;
    lockoutEnd?: Date;
    listRoleId?: string[];
    listPermission?: string[];
    lastModificationTime?: Date;
    birthDay?: Date;
    provinceCode?: string;
    wardCode?: string;
    isActived?: boolean;
    isLockoutEnabled?: boolean;
    mustChangePassword?: boolean;
    isSuperAdmin?: boolean;
}

export interface AppBootstrapExtendDto {
    theme?: OrdThemeDto;
    [key: string]: any;
}

export interface AppUserCurrentDto {
    [key: string]: any;
}
