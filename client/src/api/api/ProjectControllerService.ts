import {
  type ProjectStatusUpdateDTO,
  type ProjectStatus,
  type CommonResponseProjectEntity,
  type ProjectEntity,
  type ProjectCollaborator,
  type AccessRole,
  type ProjectStats,
  type AccessSettings,
  type ProjectCreateUpdateDTO,
  type ProjectCollaboratorDTO,
  type PageRequestDtoProjectFilterDTO,
  type ProjectFilterDTO,
  type CommonResponsePageResultProjectEntity,
  type PageResultProjectEntity,
  type ProjectCheckInputDTO,
  type CommonResponseProjectCheckResponseDTO,
  type ProjectCheckResponseDTO,
  type CommonResponseString,
  type CommonResponseProjectStats,
  type CommonResponseListProjectMemberDTO,
  type ProjectMemberDTO,
  type PageRequestDtoAuditLogFilterDTO,
  type AuditLogFilterDTO,
  type AuditAction,
  type CommonResponsePageResultAuditLogEntity,
  type PageResultAuditLogEntity,
  type AuditLogEntity,
  type AuditActorType,
  type AuditTargetType,
  type AuditChanges,
  type AuditRequestInfo,
  type CommonResponseProjectDetailDTO,
  type ProjectDetailDTO,
  type MyAccessDTO,
  type Action,
  type AccessSourceDTO,
  type SourceType,
  type FolderBreadcrumbItemDTO,
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

export class ProjectControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static status(
    params: {
      /**  */
      projectId: string;
      /** requestBody */
      body?: ProjectStatusUpdateDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseProjectEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/project/{projectId}/status';
      url = url.replace('{projectId}', params['projectId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static leave(
    params: {
      /**  */
      projectId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseProjectEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/project/{projectId}/leave';
      url = url.replace('{projectId}', params['projectId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static updateDetail(
    params: {
      /** requestBody */
      body?: ProjectCreateUpdateDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseProjectEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/project/update-detail';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static restore(
    params: {
      /**  */
      projectId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseProjectEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/project/restore/{projectId}';
      url = url.replace('{projectId}', params['projectId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static moveToProject(
    params: {
      /**  */
      projectId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseProjectEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/project/move-to-project/{projectId}';
      url = url.replace('{projectId}', params['projectId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static getPage(
    params: {
      /** requestBody */
      body?: PageRequestDtoProjectFilterDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponsePageResultProjectEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/project/get-page';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static createNew(
    params: {
      /** requestBody */
      body?: ProjectCreateUpdateDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseProjectEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/project/create-new';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static checkProject(
    params: {
      /** requestBody */
      body?: ProjectCheckInputDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseProjectCheckResponseDTO> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/project/check-project';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static archive(
    params: {
      /**  */
      projectId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/project/archive/{projectId}';
      url = url.replace('{projectId}', params['projectId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static stats(
    params: {
      /**  */
      projectId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseProjectStats> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/project/{projectId}/stats';
      url = url.replace('{projectId}', params['projectId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static members(
    params: {
      /**  */
      projectId: string;
      /**  */
      searchQuery?: string;
      /**  */
      reviewSessionId?: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseListProjectMemberDTO> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/project/{projectId}/members';
      url = url.replace('{projectId}', params['projectId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);
      configs.params = { searchQuery: params['searchQuery'], reviewSessionId: params['reviewSessionId'] };

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static auditLog(
    params: {
      /**  */
      projectId: string;
      /**  */
      dto: PageRequestDtoAuditLogFilterDTO;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponsePageResultAuditLogEntity> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/project/{projectId}/audit-log';
      url = url.replace('{projectId}', params['projectId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);
      configs.params = { dto: params['dto'] };

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static getById(
    params: {
      /**  */
      projectId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseProjectDetailDTO> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/project/get-by-id/{projectId}';
      url = url.replace('{projectId}', params['projectId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static delete(
    params: {
      /**  */
      projectId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseString> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/project/delete/{projectId}';
      url = url.replace('{projectId}', params['projectId'] + '');

      const configs: IRequestConfig = getConfigs('delete', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
