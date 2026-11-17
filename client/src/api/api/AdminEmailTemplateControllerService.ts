import {
  type CommonResponseAdminEmailTemplateDto,
  type AdminEmailTemplateDto,
  type AdminEmailTemplateUpdateDto,
  type AdminMailTestRequestDto,
  type CommonResponseBoolean,
  type AdminEmailPreviewRequestDto,
  type CommonResponseAdminEmailPreviewDto,
  type AdminEmailPreviewDto,
  type CommonResponseListAdminEmailTemplateRowDto,
  type AdminEmailTemplateRowDto,
  type LocaleState,
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

export class AdminEmailTemplateControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static emailTemplates(
    params: {
      /**  */
      code: string;
      /**  */
      locale: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAdminEmailTemplateDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/email-templates/{code}/{locale}';
      url = url.replace('{code}', params['code'] + '');
      url = url.replace('{locale}', params['locale'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static emailTemplates1(
    params: {
      /**  */
      code: string;
      /**  */
      locale: string;
      /** requestBody */
      body?: AdminEmailTemplateUpdateDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAdminEmailTemplateDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/email-templates/{code}/{locale}';
      url = url.replace('{code}', params['code'] + '');
      url = url.replace('{locale}', params['locale'] + '');

      const configs: IRequestConfig = getConfigs('put', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static sendTest(
    params: {
      /**  */
      code: string;
      /**  */
      locale: string;
      /** requestBody */
      body?: AdminMailTestRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseBoolean> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/email-templates/{code}/{locale}/send-test';
      url = url.replace('{code}', params['code'] + '');
      url = url.replace('{locale}', params['locale'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

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
      code: string;
      /**  */
      locale: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAdminEmailTemplateDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/email-templates/{code}/{locale}/reset';
      url = url.replace('{code}', params['code'] + '');
      url = url.replace('{locale}', params['locale'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static preview(
    params: {
      /** requestBody */
      body?: AdminEmailPreviewRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseAdminEmailPreviewDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/email-templates/preview';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static emailTemplates2(options: IRequestOptions = {}): Promise<CommonResponseListAdminEmailTemplateRowDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/admin/email-templates';

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
