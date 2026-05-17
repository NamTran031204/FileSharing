import {
  type CommonResponseProcessingStatusResponseDto,
  type ProcessingStatusResponseDto,
  type ProcessingStatus,
  type ProcessingJobStatus,
  type ProcessingJobProgress,
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

export class ProcessingControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static processing(
    params: {
      /**  */
      assetId: string;
      /**  */
      versionNumber: number;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseProcessingStatusResponseDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/processing/{assetId}/{versionNumber}';
      url = url.replace('{assetId}', params['assetId'] + '');
      url = url.replace('{versionNumber}', params['versionNumber'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
