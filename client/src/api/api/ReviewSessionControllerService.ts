import {
  type ReviewSessionDecisionDTO,
  type ReviewSessionStatus,
  type CommonResponseReviewSessionEntity,
  type ReviewSessionEntity,
  type ReviewStatusHistory,
  type ReviewerInfo,
  type ReviewerRole,
  type ReviewMetrics,
  type ReviewSessionCreateDTO,
  type CommonResponseListReviewSessionEntity,
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

export class ReviewSessionControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static decision(
    params: {
      /**  */
      reviewSessionId: string;
      /** requestBody */
      body?: ReviewSessionDecisionDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseReviewSessionEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/review-session/{reviewSessionId}/decision';
      url = url.replace('{reviewSessionId}', params['reviewSessionId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static create(
    params: {
      /** requestBody */
      body?: ReviewSessionCreateDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseReviewSessionEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/review-session/create';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static asset(
    params: {
      /**  */
      assetId: string;
      /**  */
      versionNumber?: number;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseListReviewSessionEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/review-session/asset/{assetId}';
      url = url.replace('{assetId}', params['assetId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);
      configs.params = { versionNumber: params['versionNumber'] };

      axios(configs, resolve, reject);
    });
  }
}
