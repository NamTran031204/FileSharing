import {
  type NotificationCreateUpdateDTO,
  type NotificationType,
  type NotificationContext,
  type NotificationDelivery,
  type DeliveryStatus,
  type CommonResponseNotificationEntity,
  type NotificationEntity,
  type PageRequestDtoNotificationFilterDTO,
  type NotificationFilterDTO,
  type CommonResponsePageResultNotificationEntity,
  type PageResultNotificationEntity,
  type CommonResponseString,
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

export class NotificationControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static updateDetail(
    params: {
      /** requestBody */
      body?: NotificationCreateUpdateDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseNotificationEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/notification/update-detail';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static getPage(
    params: {
      /** requestBody */
      body?: PageRequestDtoNotificationFilterDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponsePageResultNotificationEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/notification/get-page';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static delete(
    params: {
      /**  */
      notificationId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/notification/delete/{notificationId}';
      url = url.replace('{notificationId}', params['notificationId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static createNew(
    params: {
      /** requestBody */
      body?: NotificationCreateUpdateDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseNotificationEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/notification/create-new';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static getById(
    params: {
      /**  */
      notificationId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseNotificationEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/notification/get-by-id/{notificationId}';
      url = url.replace('{notificationId}', params['notificationId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
