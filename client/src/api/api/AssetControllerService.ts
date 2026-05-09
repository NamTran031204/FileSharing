import {
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
  type UserFilePermission,
  type FileAppPermission,
  type PageRequestDtoVersionFilterRequestDto,
  type VersionFilterRequestDto,
  type CommonResponsePageResultMetadataEntity,
  type PageResultMetadataEntity,
  type CommonResponseString,
  type VersionCreateRequestDto,
  type AssetStatus,
  type CommonResponseVersionCreateResponseDto,
  type VersionCreateResponseDto,
  type InitiateUploadResponseDto,
  type AssetUpdateRequestDto,
  type CommonResponseAssetEntity,
  type AssetEntity,
  type AssetMoveRequestDto,
  type PageRequestDtoAssetFilterRequestDto,
  type AssetFilterRequestDto,
  type CommonResponsePageResultAssetSummaryDto,
  type PageResultAssetSummaryDto,
  type AssetSummaryDto,
  type AssetCreateRequestDto,
  type CommonResponseAssetCreateResponseDto,
  type AssetCreateResponseDto,
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
  static delete(
    params: {
      /**  */
      versionId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/asset/version/delete/{versionId}';
      url = url.replace('{versionId}', params['versionId'] + '');

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
      body?: VersionCreateRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseVersionCreateResponseDto> {
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
  static updateDetail1(
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
  static getPage1(
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
  static delete1(
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
  static createNew1(
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
  static getById(
    params: {
      /**  */
      versionId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseMetadataEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/asset/version/get-by-id/{versionId}';
      url = url.replace('{versionId}', params['versionId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

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
  static getById1(
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
