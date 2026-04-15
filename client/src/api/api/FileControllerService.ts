import {
  MetadataUpdateRequestDto,
  ObjectPermission,
  ObjectVisibility,
  UserFilePermission,
  CommonResponseMetadataEntity,
  MetadataEntity,
  MediaType,
  UploadStatus,
  ProcessingStatus,
  MediaInfo,
  FileAppPermission,
  EmailSenderRequestDto,
  CommonResponseString,
  PageRequestDtoUserFileFilterPageRequestDto,
  UserFileFilterPageRequestDto,
  CommonResponsePageResultMetadataEntity,
  PageResultMetadataEntity,
  IList,
  List,
  IListResult,
  ListResultDto,
  IPagedResult,
  PagedResultDto,
  Dictionary,
  IDictionary,
  IRequestOptions,
  IRequestConfig,
  getConfigs,
  axios,
  basePath
} from './index.defs';

export class FileControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static update(
    params: {
      /**  */
      fileId: string;
      /** requestBody */
      body?: MetadataUpdateRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseMetadataEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/file/update/{fileId}';
      url = url.replace('{fileId}', params['fileId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static sendEmail(
    params: {
      /** requestBody */
      body?: EmailSenderRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/file/send-email';

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
      body?: PageRequestDtoUserFileFilterPageRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponsePageResultMetadataEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/file/get-page';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
}
