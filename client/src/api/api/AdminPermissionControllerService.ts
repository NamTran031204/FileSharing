import {
  type CommonResponseListAdminPermissionGroupDto,
  type AdminPermissionGroupDto,
  type Resource,
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

export class AdminPermissionControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static permissions(options: IRequestOptions = {}): Promise<CommonResponseListAdminPermissionGroupDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/permissions';

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
