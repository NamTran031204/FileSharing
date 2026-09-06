import {
  type CommonResponseListMediaRenditionEntity,
  type MediaRenditionEntity,
  type RenditionType,
  type RenditionResolution,
  type RenditionStatus,
  type CommonResponsePlaybackDataResponseDto,
  type PlaybackDataResponseDto,
  type ProcessingStatus,
  type StreamingResponseBody,
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

export class PlaybackControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static renditions(
    params: {
      /**  */
      assetId: string;
      /**  */
      versionNumber: number;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseListMediaRenditionEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/versions/{assetId}/{versionNumber}/renditions';
      url = url.replace('{assetId}', params['assetId'] + '');
      url = url.replace('{versionNumber}', params['versionNumber'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static playback(
    params: {
      /**  */
      assetId: string;
      /**  */
      versionNumber: number;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponsePlaybackDataResponseDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/versions/{assetId}/{versionNumber}/playback';
      url = url.replace('{assetId}', params['assetId'] + '');
      url = url.replace('{versionNumber}', params['versionNumber'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static segment(
    params: {
      /**  */
      assetId: string;
      /**  */
      versionNumber: number;
      /**  */
      filename: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<StreamingResponseBody> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/versions/{assetId}/{versionNumber}/hls/segment/{filename}';
      url = url.replace('{assetId}', params['assetId'] + '');
      url = url.replace('{versionNumber}', params['versionNumber'] + '');
      url = url.replace('{filename}', params['filename'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static manifest(
    params: {
      /**  */
      assetId: string;
      /**  */
      versionNumber: number;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/versions/{assetId}/{versionNumber}/hls/manifest';
      url = url.replace('{assetId}', params['assetId'] + '');
      url = url.replace('{versionNumber}', params['versionNumber'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
