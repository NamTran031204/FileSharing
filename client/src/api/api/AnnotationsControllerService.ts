import {
  type AnnotationsCreateUpdateDTO,
  type AnnotationType,
  type AnnotationTimeCode,
  type AnnotationRegion,
  type Shape,
  type AnnotationPoint,
  type AnnotationStatus,
  type CommonResponseAnnotationsEntity,
  type AnnotationsEntity,
  type PageRequestDtoAnnotationsFilterDTO,
  type AnnotationsFilterDTO,
  type CommonResponsePageResultAnnotationsEntity,
  type PageResultAnnotationsEntity,
  type CommonResponseString,
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
  static updateDetail(
    params: {
      /** requestBody */
      body?: AnnotationsCreateUpdateDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAnnotationsEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/annotations/update-detail';

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
      body?: PageRequestDtoAnnotationsFilterDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponsePageResultAnnotationsEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/annotations/get-page';

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
      annotationId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/annotations/delete/{annotationId}';
      url = url.replace('{annotationId}', params['annotationId'] + '');

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
      body?: AnnotationsCreateUpdateDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAnnotationsEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/annotations/create-new';

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
      annotationId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAnnotationsEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/annotations/get-by-id/{annotationId}';
      url = url.replace('{annotationId}', params['annotationId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
