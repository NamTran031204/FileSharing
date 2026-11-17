import {
  type AdminSettingUpdateRequestDto,
  type CommonResponseListAdminSettingItemDto,
  type AdminSettingItemDto,
  type CommonResponseAdminSettingItemDto,
  type AdminMailTestRequestDto,
  type CommonResponseAdminMailTestResultDto,
  type AdminMailTestResultDto,
  type CommonResponseListAdminSettingGroupDto,
  type AdminSettingGroupDto,
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

export class AdminSettingControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static settings(
    params: {
      /**  */
      group: string;
      /** requestBody */
      body?: AdminSettingUpdateRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseListAdminSettingItemDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/settings/{group}';
      url = url.replace('{group}', params['group'] + '');

      const configs: IRequestConfig = getConfigs('put', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static reset(
    params: {
      /**  */
      key: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAdminSettingItemDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/settings/{key}/reset';
      url = url.replace('{key}', params['key'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static test(
    params: {
      /** requestBody */
      body?: AdminMailTestRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAdminMailTestResultDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/settings/mail/test';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static settings1(options: IRequestOptions = {}): Promise<CommonResponseListAdminSettingGroupDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/settings';

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
