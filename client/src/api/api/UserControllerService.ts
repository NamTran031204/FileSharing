import {
  type CommonResponseUserDto,
  type UserDto,
  type UserGrantedRole,
  type AuthProvider,
  type UpdateUserRequestDto,
  type CommonResponseString,
  type PageRequestDtoUserSearchRequestDto,
  type UserSearchRequestDto,
  type CommonResponsePageResultUserDto,
  type PageResultUserDto,
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

export class UserControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static users(
    params: {
      /**  */
      userId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseUserDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/users/{userId}';
      url = url.replace('{userId}', params['userId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

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
      /** requestBody */
      body?: UpdateUserRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseUserDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/users/{userId}';
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
  static users2(
    params: {
      /**  */
      userId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/users/{userId}';
      url = url.replace('{userId}', params['userId'] + '');

      const configs: IRequestConfig = getConfigs('delete', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static search(
    params: {
      /** requestBody */
      body?: PageRequestDtoUserSearchRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponsePageResultUserDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/users/search';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static users3(options: IRequestOptions = {}): Promise<CommonResponseUserDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/users';

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static email(
    params: {
      /**  */
      email: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseUserDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/users/email/{email}';
      url = url.replace('{email}', params['email'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
