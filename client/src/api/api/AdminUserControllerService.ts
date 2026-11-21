import {
  type AdminAssignRolesDto,
  type CommonResponseAdminUserRowDto,
  type AdminUserRowDto,
  type UserGrantedRole,
  type AuthProvider,
  type AdminRoleRef,
  type AdminCreateUserRequestDto,
  type PageRequestDtoAdminUserFilterDto,
  type AdminUserFilterDto,
  type CommonResponsePageResultAdminUserRowDto,
  type PageResultAdminUserRowDto,
  type CommonResponseAdminUserDetailDto,
  type AdminUserDetailDto,
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

export class AdminUserControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static adminRoles(
    params: {
      /**  */
      userId: string;
      /** requestBody */
      body?: AdminAssignRolesDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAdminUserRowDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/users/{userId}/admin-roles';
      url = url.replace('{userId}', params['userId'] + '');

      const configs: IRequestConfig = getConfigs('put', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static users(
    params: {
      /** requestBody */
      body?: AdminCreateUserRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAdminUserRowDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/users';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static unlock(
    params: {
      /**  */
      userId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAdminUserRowDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/users/{userId}/unlock';
      url = url.replace('{userId}', params['userId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static revokeSessions(
    params: {
      /**  */
      userId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAdminUserRowDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/users/{userId}/revoke-sessions';
      url = url.replace('{userId}', params['userId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static lock(
    params: {
      /**  */
      userId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAdminUserRowDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/users/{userId}/lock';
      url = url.replace('{userId}', params['userId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static getPaged(
    params: {
      /** requestBody */
      body?: PageRequestDtoAdminUserFilterDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponsePageResultAdminUserRowDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/users/get-paged';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static users1(
    params: {
      /**  */
      userId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAdminUserDetailDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/users/{userId}';
      url = url.replace('{userId}', params['userId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
