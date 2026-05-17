import {
  type FolderUpdateRequestDTO,
  type CommonResponseFolderEntity,
  type FolderEntity,
  type FolderPermission,
  type GrantedProjectPermission,
  type FolderVisibility,
  type FolderStats,
  type PageRequestDtoFolderFilterRequestDTO,
  type FolderFilterRequestDTO,
  type CommonResponsePageResultFolderEntity,
  type PageResultFolderEntity,
  type FolderTreeCreateRequestDTO,
  type FolderTreeNodeDTO,
  type CommonResponseFolderTreeCreateResponseDTO,
  type FolderTreeCreateResponseDTO,
  type FolderTreeMappingDTO,
  type FolderCreateRequestDTO,
  type FolderChangeVisibilityRequestDTO,
  type CommonResponseFolderArchiveResponseDTO,
  type FolderArchiveResponseDTO,
  type CommonResponseFolderTreeResponseDTO,
  type FolderTreeResponseDTO,
  type FolderBreadcrumbItemDTO,
  type FolderTreeItemDTO,
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

export class FolderControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static updateDetail(
    params: {
      /** requestBody */
      body?: FolderUpdateRequestDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseFolderEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/folder/update-detail';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static restore(
    params: {
      /**  */
      folderId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseFolderEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/folder/restore/{folderId}';
      url = url.replace('{folderId}', params['folderId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static getTrash(
    params: {
      /** requestBody */
      body?: PageRequestDtoFolderFilterRequestDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponsePageResultFolderEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/folder/get-trash';

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
      body?: PageRequestDtoFolderFilterRequestDTO;
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
  static createTree(
    params: {
      /** requestBody */
      body?: FolderTreeCreateRequestDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseFolderTreeCreateResponseDTO> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/folder/create-tree';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static createNew(
    params: {
      /** requestBody */
      body?: FolderCreateRequestDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseFolderEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/folder/create-new';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static changeVisibility(
    params: {
      /** requestBody */
      body?: FolderChangeVisibilityRequestDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseFolderEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/folder/change-visibility';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static archive(
    params: {
      /**  */
      folderId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseFolderArchiveResponseDTO> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/folder/archive/{folderId}';
      url = url.replace('{folderId}', params['folderId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static getTree(
    params: {
      /**  */
      projectId: string;
      /**  */
      currentFolderId?: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseFolderTreeResponseDTO> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/folder/get-tree/{projectId}';
      url = url.replace('{projectId}', params['projectId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);
      configs.params = { currentFolderId: params['currentFolderId'] };

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
