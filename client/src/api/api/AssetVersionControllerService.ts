import {
  type CommonResponseString,
  type VersionUpdateRequestDto,
  type ObjectVisibility,
  type ObjectPermission,
  type ProcessingStatus,
  type MediaInfoDto,
  type CommonResponseMetadataEntity,
  type MetadataEntity,
  type MediaType,
  type UploadStatus,
  type MediaInfo,
  type PageRequestDtoVersionFilterRequestDto,
  type VersionFilterRequestDto,
  type CommonResponsePageResultMetadataEntity,
  type PageResultMetadataEntity,
  type AssetCreateRequestDto,
  type AssetStatus,
  type CommonResponseAssetCreateResponseDto,
  type AssetCreateResponseDto,
  type AssetEntity,
  type InitiateUploadResponseDto,
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

export class AssetVersionControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static delete(
    params: {
      /**  */
      assetId: string;
      /**  */
      versionNumber: number;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/asset/version/{assetId}/{versionNumber}/delete';
      url = url.replace('{assetId}', params['assetId'] + '');
      url = url.replace('{versionNumber}', params['versionNumber'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static updateDetail(
    params: {
      /** requestBody */
      body?: VersionUpdateRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseMetadataEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/asset/version/update-detail';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static getPage(
    params: {
      /** requestBody */
      body?: PageRequestDtoVersionFilterRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponsePageResultMetadataEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/asset/version/get-page';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

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
      let url = basePath + '/api/asset/version/create-new';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static version(
    params: {
      /**  */
      assetId: string;
      /**  */
      versionNumber: number;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseMetadataEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/asset/version/{assetId}/{versionNumber}';
      url = url.replace('{assetId}', params['assetId'] + '');
      url = url.replace('{versionNumber}', params['versionNumber'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
