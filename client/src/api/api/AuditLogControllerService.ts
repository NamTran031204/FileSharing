import {
  type CommonResponsePageResultAuditLogItemDTO,
  type PageResultAuditLogItemDTO,
  type AuditLogItemDTO,
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

export class AuditLogControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static asset(
    params: {
      /**  */
      assetId: string;
      /**  */
      versionNumber?: number;
      /**  */
      page?: number;
      /**  */
      size?: number;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponsePageResultAuditLogItemDTO> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/audit-logs/asset/{assetId}';
      url = url.replace('{assetId}', params['assetId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);
      configs.params = { versionNumber: params['versionNumber'], page: params['page'], size: params['size'] };

      axios(configs, resolve, reject);
    });
  }
}
