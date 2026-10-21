import {
  type ProofSubmitRequestDto,
  type CommonResponseProofSubmitResponseDto,
  type ProofSubmitResponseDto,
  type ProofSessionCreateRequestDto,
  type CommonResponseProofSessionResponseDto,
  type ProofSessionResponseDto,
  type CommonResponseProofLandingResponseDto,
  type ProofLandingResponseDto,
  type CommonResponsePageResultProofAssetItemDto,
  type PageResultProofAssetItemDto,
  type ProofAssetItemDto,
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

export class ProofPublicControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static submit(
    params: {
      /**  */
      shareToken: string;
      /** requestBody */
      body?: ProofSubmitRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseProofSubmitResponseDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/public/proof/{shareToken}/submit';
      url = url.replace('{shareToken}', params['shareToken'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static sessions(
    params: {
      /**  */
      shareToken: string;
      /** requestBody */
      body?: ProofSessionCreateRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseProofSessionResponseDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/public/proof/{shareToken}/sessions';
      url = url.replace('{shareToken}', params['shareToken'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static proof(
    params: {
      /**  */
      shareToken: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseProofLandingResponseDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/public/proof/{shareToken}';
      url = url.replace('{shareToken}', params['shareToken'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static assets(
    params: {
      /**  */
      shareToken: string;
      /**  */
      page?: number;
      /**  */
      size?: number;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponsePageResultProofAssetItemDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/public/proof/{shareToken}/assets';
      url = url.replace('{shareToken}', params['shareToken'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);
      configs.params = { page: params['page'], size: params['size'] };

      axios(configs, resolve, reject);
    });
  }
}
