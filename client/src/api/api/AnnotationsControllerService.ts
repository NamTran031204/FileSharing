import {
  type AnnotationIdDTO,
  type CommonResponseAnnotationsEntity,
  type AnnotationsEntity,
  type AnnotationBody,
  type UserMention,
  type MediaType,
  type AnnotationTimeCode,
  type ShapeInfo,
  type Shape,
  type AnnotationStatus,
  type AnnotationEditDTO,
  type CommonResponseString,
  type AnnotationCreateDTO,
  type CommonResponseAnnotationSummaryResponse,
  type AnnotationSummaryResponse,
  type SseEmitter,
  type CommonResponseListAnnotationsEntity,
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

export class AnnotationsControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static resolve(
    params: {
      /** requestBody */
      body?: AnnotationIdDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAnnotationsEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/annotation/resolve';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static reopen(
    params: {
      /** requestBody */
      body?: AnnotationIdDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAnnotationsEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/annotation/reopen';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static edit(
    params: {
      /** requestBody */
      body?: AnnotationEditDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAnnotationsEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/annotation/edit';

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
      /** requestBody */
      body?: AnnotationIdDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/annotation/delete';

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
      body?: AnnotationCreateDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAnnotationsEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/annotation/create';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static summary(
    params: {
      /**  */
      assetId: string;
      /**  */
      versionNumber?: number;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAnnotationSummaryResponse> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/annotation/summary';

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);
      configs.params = { assetId: params['assetId'], versionNumber: params['versionNumber'] };

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static subscribe(
    params: {
      /**  */
      assetId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<SseEmitter> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/annotation/subscribe/{assetId}';
      url = url.replace('{assetId}', params['assetId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static listRootCommentByAsset(
    params: {
      /**  */
      assetId: string;
      /**  */
      versionNumber: number;
      /**  */
      status?: AnnotationStatus;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseListAnnotationsEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/annotation/list-root-comment-by-asset';

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);
      configs.params = { assetId: params['assetId'], versionNumber: params['versionNumber'], status: params['status'] };

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static listReplies(
    params: {
      /**  */
      threadRootId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseListAnnotationsEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/annotation/list-replies';

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);
      configs.params = { threadRootId: params['threadRootId'] };

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static getById(
    params: {
      /**  */
      annotationId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAnnotationsEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/annotation/get-by-id';

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);
      configs.params = { annotationId: params['annotationId'] };

      axios(configs, resolve, reject);
    });
  }
}
