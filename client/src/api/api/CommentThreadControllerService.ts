import {
  type CommentThreadCreateUpdateDTO,
  type CommentMessage,
  type CommentAttachment,
  type CommentAttachmentType,
  type ThreadStatus,
  type CommonResponseCommentThreadEntity,
  type CommentThreadEntity,
  type PageRequestDtoCommentThreadFilterDTO,
  type CommentThreadFilterDTO,
  type CommonResponsePageResultCommentThreadEntity,
  type PageResultCommentThreadEntity,
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

export class CommentThreadControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static updateDetail(
    params: {
      /** requestBody */
      body?: CommentThreadCreateUpdateDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseCommentThreadEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/comment-thread/update-detail';

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
      body?: PageRequestDtoCommentThreadFilterDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponsePageResultCommentThreadEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/comment-thread/get-page';

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
      threadId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/comment-thread/delete/{threadId}';
      url = url.replace('{threadId}', params['threadId'] + '');

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
      body?: CommentThreadCreateUpdateDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseCommentThreadEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/comment-thread/create-new';

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
      threadId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseCommentThreadEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/comment-thread/get-by-id/{threadId}';
      url = url.replace('{threadId}', params['threadId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
