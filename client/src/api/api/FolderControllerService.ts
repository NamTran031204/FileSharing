import {
  CommonResponseFolderEntity,
  FolderEntity,
  FolderPermission,
  ObjectPermission,
  FolderStats,
  PageRequestDtoMapStringObject,
  CommonResponsePageResultFolderEntity,
  PageResultFolderEntity,
  CommonResponseString,
  IList,
  List,
  IListResult,
  ListResultDto,
  IPagedResult,
  PagedResultDto,
  Dictionary,
  IDictionary,
  IRequestOptions,
  IRequestConfig,
  getConfigs,
  axios,
  basePath
} from './index.defs';

export class FolderControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static updateDetail(options: IRequestOptions = {}): Promise<CommonResponseFolderEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/folder/update-detail';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static getPage(
    params: {
      /** requestBody */
      body?: PageRequestDtoMapStringObject;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponsePageResultFolderEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/folder/get-page';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static createNew(options: IRequestOptions = {}): Promise<CommonResponseFolderEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/folder/create-new';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static getById(
    params: {
      /**  */
      folderId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseFolderEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/folder/get-by-id/{folderId}';
      url = url.replace('{folderId}', params['folderId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static delete(
    params: {
      /**  */
      folderId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/folder/delete/{folderId}';
      url = url.replace('{folderId}', params['folderId'] + '');

      const configs: IRequestConfig = getConfigs('delete', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
