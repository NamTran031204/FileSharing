import {
  AbortUploadRequestDto,
  CommonResponseString,
  CompleteUploadRequest,
  PartInfo,
  MetadataDTO,
  CommonResponseInitiateUploadResponseDto,
  InitiateUploadResponseDto,
  DownloadFileRequestDto,
  CommonResponseDownloadFileResponseDto,
  DownloadFileResponseDto,
  CommonResponseMetadataEntity,
  MetadataEntity,
  MediaType,
  UploadStatus,
  ProcessingStatus,
  MediaInfo,
  ObjectPermission,
  ObjectVisibility,
  UserFilePermission,
  FileAppPermission,
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

export class FileMetadataControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static stopUpload(
    params: {
      /** requestBody */
      body?: AbortUploadRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/file-metadata/upload/stop-upload';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static complete(
    params: {
      /** requestBody */
      body?: CompleteUploadRequest;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/file-metadata/upload/complete';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static uploadMetadata(
    params: {
      /** requestBody */
      body?: MetadataDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseInitiateUploadResponseDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/file-metadata/upload-metadata';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static restoreFile(
    params: {
      /**  */
      fileId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/file-metadata/restore-file/{fileId}';
      url = url.replace('{fileId}', params['fileId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static processEncode(options: IRequestOptions = {}): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/file-metadata/process-encode';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static download(
    params: {
      /** requestBody */
      body?: DownloadFileRequestDto;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseDownloadFileResponseDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/file-metadata/download';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static directUpload(
    params: {
      /**  */
      file: any;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/file-metadata/direct-upload';

      const configs: IRequestConfig = getConfigs('post', 'multipart/form-data', url, options);

      let data = null;
      data = new FormData();
      if (params['file']) {
        if (Object.prototype.toString.call(params['file']) === '[object Array]') {
          for (const item of params['file']) {
            data.append('file', item as any);
          }
        } else {
          data.append('file', params['file'] as any);
        }
      }

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static getFileByToken(
    params: {
      /**  */
      token: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseMetadataEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/file-metadata/get-file-by-token/{token}';
      url = url.replace('{token}', params['token'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static moveToTrash(
    params: {
      /**  */
      fileId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/file-metadata/move-to-trash/{fileId}';
      url = url.replace('{fileId}', params['fileId'] + '');

      const configs: IRequestConfig = getConfigs('delete', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static delete(
    params: {
      /**  */
      fileId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/file-metadata/delete/{fileId}';
      url = url.replace('{fileId}', params['fileId'] + '');

      const configs: IRequestConfig = getConfigs('delete', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
