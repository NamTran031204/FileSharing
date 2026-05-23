import {
  type AssetUpdateRequestDto,
  type CommonResponseAssetEntity,
  type AssetEntity,
  type MediaType,
  type AssetStatus,
  type CommonResponseString,
  type AssetMoveRequestDto,
  type PageRequestDtoAssetFilterRequestDto,
  type AssetFilterRequestDto,
  type CommonResponsePageResultAssetSummaryDto,
  type PageResultAssetSummaryDto,
  type AssetSummaryDto,
  type MetadataEntity,
  type UploadStatus,
  type ProcessingStatus,
  type MediaInfo,
  type AssetCreateRequestDto,
  type CommonResponseAssetCreateResponseDto,
  type AssetCreateResponseDto,
  type InitiateUploadResponseDto,
  type CommonResponseMetadataEntity,
  type CommonResponseAssetDetailResponseDto,
  type AssetDetailResponseDto,
  type IList,
  type List,
  type IListResult,
  type ListResultDto,
  type IPagedResult,
  type PagedResultDto,
  type Dictionary,
  type IDictionary,
  type IRequestOptions,
  type IRequestConfig,
  getConfigs,
  axios,
  basePath
} from './index.defs';

export class AssetControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static updateDetail(
    params: {
      /** requestBody */
      body?: AssetUpdateRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAssetEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/asset/update-detail';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static undoDelete(
    params: {
      /**  */
      assetId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/asset/undo-delete/{assetId}';
      url = url.replace('{assetId}', params['assetId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static restoreFromTrash(
    params: {
      /**  */
      assetId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/asset/restore-from-trash/{assetId}';
      url = url.replace('{assetId}', params['assetId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static move(
    params: {
      /** requestBody */
      body?: AssetMoveRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAssetEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/asset/move';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static moveToTrash(
    params: {
      /**  */
      assetId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/asset/move-to-trash/{assetId}';
      url = url.replace('{assetId}', params['assetId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static getPage(
    params: {
      /** requestBody */
      body?: PageRequestDtoAssetFilterRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponsePageResultAssetSummaryDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/asset/get-page';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static delete(
    params: {
      /**  */
      assetId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/asset/delete/{assetId}';
      url = url.replace('{assetId}', params['assetId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static createNew(
    params: {
      /** requestBody */
      body?: AssetCreateRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAssetCreateResponseDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/asset/create-new';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static getLatestVersion(
    params: {
      /**  */
      assetId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseMetadataEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/asset/get-latest-version/{assetId}';
      url = url.replace('{assetId}', params['assetId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static getById(
    params: {
      /**  */
      assetId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAssetDetailResponseDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/asset/get-by-id/{assetId}';
      url = url.replace('{assetId}', params['assetId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
