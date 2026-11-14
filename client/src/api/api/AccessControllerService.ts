import {
  type AccessSettingsRequestDTO,
  type CommonResponseVoid,
  type GrantRoleRequestDTO,
  type LinkRequestDTO,
  type ShareTokenTime,
  type CommonResponseLinkSettingsDTO,
  type LinkSettingsDTO,
  type AccessRole,
  type GrantRequestDTO,
  type CommonResponseJoinLinkResponseDTO,
  type JoinLinkResponseDTO,
  type CommonResponsePeopleResponseDTO,
  type PeopleResponseDTO,
  type Person,
  type SourceType,
  type CommonResponseListMentionUserDTO,
  type MentionUserDTO,
  type CommonResponseListSharedFolderDTO,
  type SharedFolderDTO,
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

export class AccessControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static settings(
    params: {
      /**  */
      type: string;
      /**  */
      id: string;
      /** requestBody */
      body?: AccessSettingsRequestDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseVoid> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/access/{type}/{id}/settings';
      url = url.replace('{type}', params['type'] + '');
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
  static grants(
    params: {
      /**  */
      type: string;
      /**  */
      id: string;
      /**  */
      userId: string;
      /** requestBody */
      body?: GrantRoleRequestDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseVoid> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/access/{type}/{id}/grants/{userId}';
      url = url.replace('{type}', params['type'] + '');
      url = url.replace('{id}', params['id'] + '');
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
  static grants1(
    params: {
      /**  */
      type: string;
      /**  */
      id: string;
      /**  */
      userId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseVoid> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/access/{type}/{id}/grants/{userId}';
      url = url.replace('{type}', params['type'] + '');
      url = url.replace('{id}', params['id'] + '');
      url = url.replace('{userId}', params['userId'] + '');

      const configs: IRequestConfig = getConfigs('delete', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static link(
    params: {
      /**  */
      id: string;
      /** requestBody */
      body?: LinkRequestDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseLinkSettingsDTO> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/access/folder/{id}/link';
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
  static grants2(
    params: {
      /**  */
      type: string;
      /**  */
      id: string;
      /** requestBody */
      body?: GrantRequestDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseVoid> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/access/{type}/{id}/grants';
      url = url.replace('{type}', params['type'] + '');
      url = url.replace('{id}', params['id'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static join(
    params: {
      /**  */
      token: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseJoinLinkResponseDTO> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/access/link/{token}/join';
      url = url.replace('{token}', params['token'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static people(
    params: {
      /**  */
      type: string;
      /**  */
      id: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponsePeopleResponseDTO> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/access/{type}/{id}/people';
      url = url.replace('{type}', params['type'] + '');
      url = url.replace('{id}', params['id'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static mentionUsers(
    params: {
      /**  */
      type: string;
      /**  */
      id: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseListMentionUserDTO> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/access/{type}/{id}/mention-users';
      url = url.replace('{type}', params['type'] + '');
      url = url.replace('{id}', params['id'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static sharedWithMe(options: IRequestOptions = {}): Promise<CommonResponseListSharedFolderDTO> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/access/shared-with-me';

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
