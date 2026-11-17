import {
  type AdminNodeDrainRequestDto,
  type CommonResponseAdminNodeDto,
  type AdminNodeDto,
  type Cpu,
  type Memory,
  type Worker,
  type Sample,
  type AdminNodeRunningJobDto,
  type CommonResponseListAdminNodeDto,
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

export class AdminNodeControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static drain(
    params: {
      /**  */
      nodeId: string;
      /** requestBody */
      body?: AdminNodeDrainRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAdminNodeDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/nodes/{nodeId}/drain';
      url = url.replace('{nodeId}', params['nodeId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static nodes(options: IRequestOptions = {}): Promise<CommonResponseListAdminNodeDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/nodes';

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
