import {
  type CommonResponseStorageStatsDTO,
  type StorageStatsDTO,
  type StorageByMediaTypeDTO,
  type StorageByProjectDTO,
  type CommonResponseReviewStatsDTO,
  type ReviewStatsDTO,
  type ReviewByProjectDTO,
  type CommonResponseListRecentActivityItemDTO,
  type RecentActivityItemDTO,
  type AuditAction,
  type AuditTargetType,
  type CommonResponseDashboardOverviewDTO,
  type DashboardOverviewDTO,
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

export class DashboardControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static storageStats(options: IRequestOptions = {}): Promise<CommonResponseStorageStatsDTO> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/dashboard/storage-stats';

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static reviewStats(options: IRequestOptions = {}): Promise<CommonResponseReviewStatsDTO> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/dashboard/review-stats';

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static recentActivities(
    params: {
      /**  */
      limit?: number;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseListRecentActivityItemDTO> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/dashboard/recent-activities';

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);
      configs.params = { limit: params['limit'] };

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static overview(options: IRequestOptions = {}): Promise<CommonResponseDashboardOverviewDTO> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/dashboard/overview';

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
