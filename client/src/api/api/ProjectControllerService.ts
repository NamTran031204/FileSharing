import {
  ProjectCreateUpdateDTO,
  ProjectStatus,
  CommonResponseProjectEntity,
  ProjectEntity,
  ProjectCollaborator,
  ProjectCollaboratorRole,
  ProjectStats,
  PageRequestDtoProjectFilterDTO,
  ProjectFilterDTO,
  CommonResponsePageResultProjectEntity,
  PageResultProjectEntity,
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

export class ProjectControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static updateDetail(
    params: {
      /** requestBody */
      body?: ProjectCreateUpdateDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseProjectEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/project/update-detail';

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
      body?: PageRequestDtoProjectFilterDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponsePageResultProjectEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/project/get-page';

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
      body?: ProjectCreateUpdateDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseProjectEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/project/create-new';

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
      projectId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/project/archive/{projectId}';
      url = url.replace('{projectId}', params['projectId'] + '');

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
      projectId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseProjectEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/project/get-by-id/{projectId}';
      url = url.replace('{projectId}', params['projectId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
