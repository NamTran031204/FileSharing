/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {type EncodedIdDto, type IRequestOptions} from "@plugin-core/shared/types/common.types";

export interface ICommonResultDtoApi<T> {
    code?: string;
    isSuccessful?: boolean;
    message?: string;
    extend?: any | null;
    data?: T
}

export interface StaticApiFetcher {
    (
        params?: {
            body?: {
                maxResultCount?: number;
                skipCount?: number;
            }
        },
        options?: IRequestOptions
    ): Promise<ICommonResultDtoApi<{
        items?: any[];
        totalCount?: string;
    }>>;
}

export interface StaticCounterByStatusApiFetcher {
    (
        params?: {
            body?: {
                maxResultCount?: number;
                skipCount?: number;
            }
        },
        options?: IRequestOptions
    ): Promise<ICommonResultDtoApi<CounterByStatusItemDto[]>>;
}

export interface CounterByStatusItemDto {
    statusValue?: any | null;
    statusDescription?: string;
    totalCount?: number;
    isTotalItem?: boolean;
}


export interface IModifyApiService {
    create: (params: { body?: any; }, options?: IRequestOptions) => Promise<ICommonResultDtoApi<any>>;
    update: (params: {
        body?: {
            encodedId?: string
        }
    }, options?: IRequestOptions) => Promise<ICommonResultDtoApi<any>>;
    remove?: (params: {
                  body?: {
                      /**  */
                      encodedId?: string;
                  }
              }, options?: IRequestOptions
    ) => Promise<ICommonResultDtoApi<any>>;
    getById?: (params: {
        body?: EncodedIdDto;
    }, options: IRequestOptions) => Promise<ICommonResultDtoApi<any>>;
}

export interface IGetPagedApiService {
    getPaged: StaticApiFetcher;
    exportToExcel?: (
        params: {
            body?: any;
        },
        options?: IRequestOptions
    ) => Promise<any>;
}
