import {
  type CommonResponseProcessingJobEntity,
  type ProcessingJobEntity,
  type ProcessingJobType,
  type ProcessingJobConfig,
  type ProcessingJobStatus,
  type ProcessingJobProgress,
  type ProcessingJobResult,
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

export class AdminProcessingControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static cancel(
    params: {
      /**  */
      jobId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseProcessingJobEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/processing/job/cancel/{jobId}';
      url = url.replace('{jobId}', params['jobId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static job(
    params: {
      /**  */
      jobId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseProcessingJobEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/processing/job/{jobId}';
      url = url.replace('{jobId}', params['jobId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
