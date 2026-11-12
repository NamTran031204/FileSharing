import {
  type UpdateUserRequestDto,
  type CommonResponseUserDto,
  type UserDto,
  type UserGrantedRole,
  type AuthProvider,
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
  static users1(options: IRequestOptions = {}): Promise<CommonResponseUserDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/users';

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
