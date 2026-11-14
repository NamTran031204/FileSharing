import {
  type CommonResponseProofSelectionDetailDto,
  type ProofSelectionDetailDto,
  type ProofSelectionStatus,
  type ProofSelectionItemDto,
  type CommonResponseListProofSelectionSummaryDto,
  type ProofSelectionSummaryDto,
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

export class ProofControllerService {
  /** Generate by swagger-axios-codegen */
  // @ts-nocheck
  /* eslint-disable */

  /**
   *
   */
  static proofSelection(
    params: {
      /**  */
      selectionId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseProofSelectionDetailDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/proof-selection/{selectionId}';
      url = url.replace('{selectionId}', params['selectionId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static proofSelections(
    params: {
      /**  */
      folderId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<CommonResponseListProofSelectionSummaryDto> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/folder/{folderId}/proof-selections';
      url = url.replace('{folderId}', params['folderId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      axios(configs, resolve, reject);
    });
  }
}
