import {
  type PartUrlBatchRequestDto,
  type CommonResponsePartUrlBatchResponseDto,
  type PartUrlBatchResponseDto,
  type CompleteUploadSessionRequestDto,
  type CompletedPartDto,
  type CommonResponseUploadResourceResponseDto,
  type UploadResourceResponseDto,
  type MediaType,
  type UploadStatus,
  type ProcessingStatus,
  type CommonResponseUploadSessionStatusResponseDto,
  type UploadSessionStatusResponseDto,
  type UploadSessionStatus,
  type UploadMode,
  type ReceivedPartDto,
  type CommonResponseAbortUploadSessionResponseDto,
  type AbortUploadSessionResponseDto,
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

export class UploadSessionControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static partUrls(
    params: {
      /**  */
      sessionId: string;
      /** requestBody */
      body?: PartUrlBatchRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponsePartUrlBatchResponseDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/uploads/{sessionId}/part-urls';
      url = url.replace('{sessionId}', params['sessionId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static complete(
    params: {
      /**  */
      sessionId: string;
      /** requestBody */
      body?: CompleteUploadSessionRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseUploadResourceResponseDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/uploads/{sessionId}/complete';
      url = url.replace('{sessionId}', params['sessionId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static uploads(
    params: {
      /**  */
      sessionId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseUploadSessionStatusResponseDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/uploads/{sessionId}';
      url = url.replace('{sessionId}', params['sessionId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static uploads1(
    params: {
      /**  */
      sessionId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAbortUploadSessionResponseDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/uploads/{sessionId}';
      url = url.replace('{sessionId}', params['sessionId'] + '');

      const configs: IRequestConfig = getConfigs('delete', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
