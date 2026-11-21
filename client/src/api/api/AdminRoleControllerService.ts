import {
  type CommonResponseAdminRoleDetailDto,
  type AdminRoleDetailDto,
  type AdminRoleUpsertDto,
  type CommonResponseVoid,
  type PageRequestDtoAdminRoleFilterDto,
  type AdminRoleFilterDto,
  type CommonResponsePageResultAdminRoleRowDto,
  type PageResultAdminRoleRowDto,
  type AdminRoleRowDto,
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

export class AdminRoleControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static roles(
    params: {
      /**  */
      id: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAdminRoleDetailDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/roles/{id}';
      url = url.replace('{id}', params['id'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static roles1(
    params: {
      /**  */
      id: string;
      /** requestBody */
      body?: AdminRoleUpsertDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAdminRoleDetailDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/roles/{id}';
      url = url.replace('{id}', params['id'] + '');

      const configs: IRequestConfig = getConfigs('put', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static roles2(
    params: {
      /**  */
      id: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseVoid> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/roles/{id}';
      url = url.replace('{id}', params['id'] + '');

      const configs: IRequestConfig = getConfigs('delete', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static roles3(
    params: {
      /** requestBody */
      body?: AdminRoleUpsertDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAdminRoleDetailDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/roles';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static getPaged(
    params: {
      /** requestBody */
      body?: PageRequestDtoAdminRoleFilterDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponsePageResultAdminRoleRowDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/roles/get-paged';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
}
