/** Generate by swagger-axios-codegen */
/* eslint-disable */
// @ts-nocheck
import axiosStatic, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

export interface IRequestOptions extends AxiosRequestConfig {
  /**
   * show loading status
   */
  loading?: boolean;
  /**
   * display error message
   */
  showError?: boolean;
  /**
   * data security, extended fields are encrypted using the specified algorithm
   */
  security?: Record<string, 'md5' | 'sha1' | 'aes' | 'des'>;
  /**
   * indicates whether Authorization credentials are required for the request
   * @default true
   */
  withAuthorization?: boolean;
}

export interface IRequestConfig {
  method?: any;
  headers?: any;
  url?: any;
  data?: any;
  params?: any;
}

// Add options interface
export interface ServiceOptions {
  axios?: AxiosInstance;
  /** only in axios interceptor config*/
  loading: boolean;
  showError: boolean;
}

// Add default options
export const serviceOptions: ServiceOptions = {};

// Instance selector
export function axios(configs: IRequestConfig, resolve: (p: any) => void, reject: (p: any) => void): Promise<any> {
  if (serviceOptions.axios) {
    return serviceOptions.axios
      .request(configs)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  } else {
    throw new Error('please inject yourself instance like axios  ');
  }
}

export function getConfigs(method: string, contentType: string, url: string, options: any): IRequestConfig {
  const configs: IRequestConfig = {
    loading: serviceOptions.loading,
    showError: serviceOptions.showError,
    ...options,
    method,
    url
  };
  configs.headers = {
    ...options.headers,
    'Content-Type': contentType
  };
  return configs;
}

export const basePath = '';

export interface IList<T> extends Array<T> {}
export interface List<T> extends Array<T> {}
export interface IDictionary<TValue> {
  [key: string]: TValue;
}
export interface Dictionary<TValue> extends IDictionary<TValue> {}

export interface IListResult<T> {
  items?: T[];
}

export class ListResultDto<T> implements IListResult<T> {
  items?: T[];
}

export interface IPagedResult<T> extends IListResult<T> {
  totalCount?: number;
  items?: T[];
}

export class PagedResultDto<T = any> implements IPagedResult<T> {
  totalCount?: number;
  items?: T[];
}

// customer definition
// empty

export interface UpdateUserRequestDto {
  /**  */
  publicUserName?: string;

  /**  */
  password?: string;

  /**  */
  roles?: UserGrantedRole[];

  /**  */
  enabled?: boolean;

  /**  */
  emailVerified?: boolean;
}

export interface CommonResponseUserDto {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: UserDto;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface UserDto {
  /**  */
  userId?: string;

  /**  */
  email?: string;

  /**  */
  publicUserName?: string;

  /**  */
  roles?: UserGrantedRole[];

  /**  */
  enabled?: boolean;

  /**  */
  emailVerified?: boolean;

  /**  */
  providers?: AuthProvider[];

  /**  */
  createdAt?: Date;

  /**  */
  updatedAt?: Date;

  /**  */
  lastLoginAt?: Date;
}

export interface PageRequestDtoUserSearchRequestDto {
  /**  */
  maxResultCount?: number;

  /**  */
  skipCount?: number;

  /**  */
  sorting?: string;

  /**  */
  filter?: UserSearchRequestDto;
}

export interface UserSearchRequestDto {
  /**  */
  searchText?: string;
}

export interface CommonResponsePageResultUserDto {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: PageResultUserDto;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface PageResultUserDto {
  /**  */
  totalCount?: string;

  /**  */
  data?: UserDto[];
}

export interface ProjectCollaboratorDTO {
  /**  */
  email?: string;

  /**  */
  permission?: GrantedPermission;
}

export interface ProjectCreateUpdateDTO {
  /**  */
  projectName?: string;

  /**  */
  projectCode?: string;

  /**  */
  description?: string;

  /**  */
  projectId?: string;

  /**  */
  startDate?: Date;

  /**  */
  endDate?: Date;

  /**  */
  collaborators?: ProjectCollaboratorDTO[];

  /**  */
  status?: ProjectStatus;
}

export interface CommonResponseProjectEntity {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: ProjectEntity;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface ProjectCollaborator {
  /**  */
  userId?: string;

  /**  */
  email?: string;

  /**  */
  permission?: GrantedPermission;

  /**  */
  addedAt?: Date;
}

export interface ProjectEntity {
  /**  */
  createdBy?: string;

  /**  */
  createdByEmail?: string;

  /**  */
  updateBy?: string;

  /**  */
  updateByEmail?: string;

  /**  */
  isActive?: boolean;

  /**  */
  createdAt?: Date;

  /**  */
  updatedAt?: Date;

  /**  */
  projectId?: string;

  /**  */
  projectName?: string;

  /**  */
  projectCode?: string;

  /**  */
  description?: string;

  /**  */
  ownerId?: string;

  /**  */
  ownerEmail?: string;

  /**  */
  category?: string;

  /**  */
  startDate?: Date;

  /**  */
  endDate?: Date;

  /**  */
  collaborators?: ProjectCollaborator[];

  /**  */
  visibility?: GrantedVisibility;

  /**  */
  stats?: ProjectStats;

  /**  */
  status?: ProjectStatus;

  /**  */
  trashedAt?: Date;

  /**  */
  shareToken?: string;

  /**  */
  shareExpiry?: Date;
}

export interface ProjectStats {
  /**  */
  folderCount?: number;

  /**  */
  assetCount?: number;

  /**  */
  totalVersions?: number;

  /**  */
  pendingReviews?: number;
}

export interface PageRequestDtoProjectFilterDTO {
  /**  */
  maxResultCount?: number;

  /**  */
  skipCount?: number;

  /**  */
  sorting?: string;

  /**  */
  filter?: ProjectFilterDTO;
}

export interface ProjectFilterDTO {
  /**  */
  email?: string;

  /**  */
  userId?: string;

  /**  */
  startDate?: Date;

  /**  */
  endDate?: Date;

  /**  */
  status?: ProjectStatus;
}

export interface CommonResponsePageResultProjectEntity {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: PageResultProjectEntity;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface PageResultProjectEntity {
  /**  */
  totalCount?: string;

  /**  */
  data?: ProjectEntity[];
}

export interface ProjectCheckInputDTO {
  /**  */
  projectName?: string;

  /**  */
  projectCode?: string;
}

export interface CommonResponseProjectCheckResponseDTO {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: ProjectCheckResponseDTO;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface ProjectCheckResponseDTO {
  /**  */
  isSuccess?: boolean;

  /**  */
  message?: string;
}

export interface CommonResponseString {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: string;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface NotificationContext {
  /**  */
  assetId?: string;

  /**  */
  assetName?: string;

  /**  */
  versionId?: string;

  /**  */
  annotationId?: string;

  /**  */
  commentId?: string;

  /**  */
  reviewSessionId?: string;

  /**  */
  actorId?: string;

  /**  */
  actorName?: string;
}

export interface NotificationCreateUpdateDTO {
  /**  */
  notificationId?: string;

  /**  */
  userId?: string;

  /**  */
  type?: NotificationType;

  /**  */
  title?: string;

  /**  */
  message?: string;

  /**  */
  link?: string;

  /**  */
  context?: NotificationContext;

  /**  */
  isRead?: boolean;

  /**  */
  deliveryStatus?: NotificationDelivery;

  /**  */
  expiresAt?: Date;
}

export interface NotificationDelivery {
  /**  */
  inApp?: DeliveryStatus;

  /**  */
  email?: DeliveryStatus;
}

export interface CommonResponseNotificationEntity {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: NotificationEntity;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface NotificationEntity {
  /**  */
  createdBy?: string;

  /**  */
  createdByEmail?: string;

  /**  */
  updateBy?: string;

  /**  */
  updateByEmail?: string;

  /**  */
  isActive?: boolean;

  /**  */
  createdAt?: Date;

  /**  */
  updatedAt?: Date;

  /**  */
  notificationId?: string;

  /**  */
  userId?: string;

  /**  */
  type?: NotificationType;

  /**  */
  title?: string;

  /**  */
  message?: string;

  /**  */
  link?: string;

  /**  */
  context?: NotificationContext;

  /**  */
  isRead?: boolean;

  /**  */
  readAt?: Date;

  /**  */
  deliveryStatus?: NotificationDelivery;

  /**  */
  expiresAt?: Date;
}

export interface NotificationFilterDTO {
  /**  */
  userId?: string;

  /**  */
  type?: NotificationType;

  /**  */
  isRead?: boolean;

  /**  */
  keyword?: string;

  /**  */
  assetId?: string;

  /**  */
  actorId?: string;

  /**  */
  inAppStatus?: DeliveryStatus;

  /**  */
  emailStatus?: DeliveryStatus;

  /**  */
  fromCreatedAt?: Date;

  /**  */
  toCreatedAt?: Date;
}

export interface PageRequestDtoNotificationFilterDTO {
  /**  */
  maxResultCount?: number;

  /**  */
  skipCount?: number;

  /**  */
  sorting?: string;

  /**  */
  filter?: NotificationFilterDTO;
}

export interface CommonResponsePageResultNotificationEntity {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: PageResultNotificationEntity;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface PageResultNotificationEntity {
  /**  */
  totalCount?: string;

  /**  */
  data?: NotificationEntity[];
}

export interface FolderPermission {
  /**  */
  userId?: string;

  /**  */
  permissions?: ObjectPermission[];

  /**  */
  grantedAt?: Date;
}

export interface FolderUpdateRequestDTO {
  /**  */
  folderId?: string;

  /**  */
  folderName?: string;

  /**  */
  description?: string;

  /**  */
  parentFolderId?: string;

  /**  */
  isActive?: boolean;

  /**  */
  permissions?: FolderPermission[];
}

export interface CommonResponseFolderEntity {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: FolderEntity;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface FolderEntity {
  /**  */
  createdBy?: string;

  /**  */
  createdByEmail?: string;

  /**  */
  updateBy?: string;

  /**  */
  updateByEmail?: string;

  /**  */
  isActive?: boolean;

  /**  */
  createdAt?: Date;

  /**  */
  updatedAt?: Date;

  /**  */
  folderId?: string;

  /**  */
  projectId?: string;

  /**  */
  parentFolderId?: string;

  /**  */
  folderName?: string;

  /**  */
  description?: string;

  /**  */
  folderPath?: string;

  /**  */
  level?: number;

  /**  */
  permissions?: FolderPermission[];

  /**  */
  stats?: FolderStats;

  /**  */
  shareToken?: string;

  /**  */
  shareExpiry?: Date;
}

export interface FolderStats {
  /**  */
  assetCount?: number;

  /**  */
  subfoldersCount?: number;

  /**  */
  pendingReviewsCount?: number;
}

export interface FolderFilterRequestDTO {
  /**  */
  projectId?: string;

  /**  */
  parentFolderId?: string;

  /**  */
  folderName?: string;

  /**  */
  isActive?: boolean;
}

export interface PageRequestDtoFolderFilterRequestDTO {
  /**  */
  maxResultCount?: number;

  /**  */
  skipCount?: number;

  /**  */
  sorting?: string;

  /**  */
  filter?: FolderFilterRequestDTO;
}

export interface CommonResponsePageResultFolderEntity {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: PageResultFolderEntity;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface PageResultFolderEntity {
  /**  */
  totalCount?: string;

  /**  */
  data?: FolderEntity[];
}

export interface FolderTreeCreateRequestDTO {
  /**  */
  projectId?: string;

  /**  */
  parentFolderId?: string;

  /**  */
  baseFolderPath?: string;

  /**  */
  rootFolderName?: string;

  /**  */
  folders?: FolderTreeNodeDTO[];

  /**  */
  createdBy?: string;
}

export interface FolderTreeNodeDTO {
  /**  */
  clientFolderKey?: string;

  /**  */
  folderName?: string;

  /**  */
  relativeFolderPath?: string;

  /**  */
  parentRelativeFolderPath?: string;

  /**  */
  level?: number;
}

export interface CommonResponseFolderTreeCreateResponseDTO {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: FolderTreeCreateResponseDTO;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface FolderTreeCreateResponseDTO {
  /**  */
  folderUploadSessionId?: string;

  /**  */
  projectId?: string;

  /**  */
  rootFolderId?: string;

  /**  */
  createdFolders?: FolderTreeMappingDTO[];

  /**  */
  existingFolders?: FolderTreeMappingDTO[];

  /**  */
  folderMappings?: FolderTreeMappingDTO[];
}

export interface FolderTreeMappingDTO {
  /**  */
  clientFolderKey?: string;

  /**  */
  relativeFolderPath?: string;

  /**  */
  folderPath?: string;

  /**  */
  folderId?: string;

  /**  */
  parentFolderId?: string;

  /**  */
  status?: string;
}

export interface FolderCreateRequestDTO {
  /**  */
  projectId?: string;

  /**  */
  parentFolderId?: string;

  /**  */
  folderName?: string;

  /**  */
  description?: string;
}

export interface MetadataUpdateRequestDto {
  /**  */
  fileName?: string;

  /**  */
  timeToLive?: number;

  /**  */
  isTrash?: boolean;

  /**  */
  publicPermission?: ObjectPermission;

  /**  */
  visibility?: ObjectVisibility;

  /**  */
  userFilePermissions?: UserFilePermission[];
}

export interface UserFilePermission {
  /**  */
  userId?: string;

  /**  */
  email?: string;

  /**  */
  permissionList?: ObjectPermission[];
}

export interface CommonResponseMetadataEntity {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: MetadataEntity;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface MediaInfo {
  /**  */
  durationMs?: number;

  /**  */
  width?: number;

  /**  */
  height?: number;

  /**  */
  frameRate?: number;

  /**  */
  codec?: string;

  /**  */
  colorSpace?: string;

  /**  */
  hasAlpha?: string;
}

export interface MetadataEntity {
  /**  */
  fileId?: string;

  /**  */
  fileName?: string;

  /**  */
  objectName?: string;

  /**  */
  assetId?: string;

  /**  */
  downloadFileName?: string;

  /**  */
  versionNumber?: number;

  /**  */
  mediaType?: MediaType;

  /**  */
  changeNote?: string;

  /**  */
  mimeType?: string;

  /**  */
  fileSize?: number;

  /**  */
  compressionAlgo?: string;

  /**  */
  uploadId?: string;

  /**  */
  shareToken?: string;

  /**  */
  status?: UploadStatus;

  /**  */
  processingStatus?: ProcessingStatus;

  /**  */
  processingError?: string;

  /**  */
  processingStartAt?: Date;

  /**  */
  processingCompleteAt?: Date;

  /**  */
  mediaInfo?: MediaInfo;

  /**  */
  ownerId?: string;

  /**  */
  ownerEmail?: string;

  /**  */
  timeToLive?: number;

  /**  */
  isActive?: boolean;

  /**  */
  publicPermission?: ObjectPermission;

  /**  */
  visibility?: ObjectVisibility;

  /**  */
  userFilePermissions?: UserFilePermission[];

  /**  */
  isTrash?: boolean;

  /**  */
  trashedAt?: Date;

  /**  */
  renditionCount?: number;

  /**  */
  publishUserPermission?: FileAppPermission;

  /**  */
  creationTimestamp?: Date;

  /**  */
  modificationTimestamp?: Date;
}

export interface EmailSenderRequestDto {
  /**  */
  toEmail?: string;

  /**  */
  objectPermission?: ObjectPermission[];

  /**  */
  uploadLink?: string;

  /**  */
  objectName?: string;
}

export interface PageRequestDtoUserFileFilterPageRequestDto {
  /**  */
  maxResultCount?: number;

  /**  */
  skipCount?: number;

  /**  */
  sorting?: string;

  /**  */
  filter?: UserFileFilterPageRequestDto;
}

export interface UserFileFilterPageRequestDto {
  /**  */
  mimeType?: string;

  /**  */
  status?: UploadStatus;

  /**  */
  isActive?: boolean;

  /**  */
  isTrash?: boolean;

  /**  */
  isIncludeSharedFile?: boolean;

  /**  */
  creationTimestampStartDate?: Date;

  /**  */
  creationTimestampEndDate?: Date;
}

export interface CommonResponsePageResultMetadataEntity {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: PageResultMetadataEntity;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface PageResultMetadataEntity {
  /**  */
  totalCount?: string;

  /**  */
  data?: MetadataEntity[];
}

export interface AbortUploadRequestDto {
  /**  */
  uploadId?: string;

  /**  */
  objectName?: string;
}

export interface CompleteUploadRequest {
  /**  */
  objectName?: string;

  /**  */
  uploadId?: string;

  /**  */
  parts?: PartInfo[];
}

export interface PartInfo {
  /**  */
  partNumber?: number;

  /**  */
  etag?: string;
}

export interface MetadataDTO {
  /**  */
  fileName?: string;

  /**  */
  objectName?: string;

  /**  */
  mimeType?: string;

  /**  */
  fileSize?: number;

  /**  */
  compressionAlgo?: string;

  /**  */
  timeToLive?: number;
}

export interface CommonResponseInitiateUploadResponseDto {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: InitiateUploadResponseDto;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface InitiateUploadResponseDto {
  /**  */
  uploadId?: string;

  /**  */
  partUrl?: object;
}

export interface DownloadFileRequestDto {
  /**  */
  objectName?: string;

  /**  */
  downloadFileName?: string;
}

export interface CommonResponseDownloadFileResponseDto {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: DownloadFileResponseDto;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface DownloadFileResponseDto {
  /**  */
  url?: string;

  /**  */
  fileSize?: number;

  /**  */
  fileName?: string;

  /**  */
  mimeType?: string;
}

export interface CommentAttachment {
  /**  */
  type?: CommentAttachmentType;

  /**  */
  fileId?: string;

  /**  */
  fileName?: string;

  /**  */
  fileSize?: string;
}

export interface CommentMessage {
  /**  */
  commentId?: string;

  /**  */
  replyToComment?: string;

  /**  */
  content?: string;

  /**  */
  mentions?: string[];

  /**  */
  attachments?: CommentAttachment[];

  /**  */
  createdBy?: string;

  /**  */
  createdByEmail?: string;

  /**  */
  createdByName?: string;

  /**  */
  createdAt?: Date;

  /**  */
  editedAt?: Date;
}

export interface CommentThreadCreateUpdateDTO {
  /**  */
  threadId?: string;

  /**  */
  assetId?: string;

  /**  */
  versionId?: string;

  /**  */
  annotations?: string[];

  /**  */
  rootComment?: CommentMessage;

  /**  */
  replies?: CommentMessage[];

  /**  */
  status?: ThreadStatus;
}

export interface CommentThreadEntity {
  /**  */
  createdBy?: string;

  /**  */
  createdByEmail?: string;

  /**  */
  updateBy?: string;

  /**  */
  updateByEmail?: string;

  /**  */
  isActive?: boolean;

  /**  */
  createdAt?: Date;

  /**  */
  updatedAt?: Date;

  /**  */
  threadId?: string;

  /**  */
  assetId?: string;

  /**  */
  versionId?: string;

  /**  */
  annotations?: string[];

  /**  */
  rootComment?: CommentMessage;

  /**  */
  replies?: CommentMessage[];

  /**  */
  replyCount?: number;

  /**  */
  participants?: string[];

  /**  */
  lastActivityAt?: Date;

  /**  */
  status?: ThreadStatus;

  /**  */
  resolvedAt?: Date;

  /**  */
  resolvedBy?: string;
}

export interface CommonResponseCommentThreadEntity {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: CommentThreadEntity;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface CommentThreadFilterDTO {
  /**  */
  assetId?: string;

  /**  */
  versionId?: string;

  /**  */
  annotationId?: string;

  /**  */
  participant?: string;

  /**  */
  createdBy?: string;

  /**  */
  keyword?: string;

  /**  */
  status?: ThreadStatus;

  /**  */
  fromLastActivityAt?: Date;

  /**  */
  toLastActivityAt?: Date;
}

export interface PageRequestDtoCommentThreadFilterDTO {
  /**  */
  maxResultCount?: number;

  /**  */
  skipCount?: number;

  /**  */
  sorting?: string;

  /**  */
  filter?: CommentThreadFilterDTO;
}

export interface CommonResponsePageResultCommentThreadEntity {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: PageResultCommentThreadEntity;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface PageResultCommentThreadEntity {
  /**  */
  totalCount?: string;

  /**  */
  data?: CommentThreadEntity[];
}

export interface MediaInfoDto {
  /**  */
  durationMs?: number;

  /**  */
  width?: number;

  /**  */
  height?: number;

  /**  */
  frameRate?: number;

  /**  */
  codec?: string;

  /**  */
  colorSpace?: string;

  /**  */
  hasAlpha?: string;
}

export interface VersionUpdateRequestDto {
  /**  */
  versionId?: string;

  /**  */
  downloadFileName?: string;

  /**  */
  visibility?: ObjectVisibility;

  /**  */
  publicPermission?: ObjectPermission;

  /**  */
  processingStatus?: ProcessingStatus;

  /**  */
  processingError?: string;

  /**  */
  mediaInfo?: MediaInfoDto;
}

export interface PageRequestDtoVersionFilterRequestDto {
  /**  */
  maxResultCount?: number;

  /**  */
  skipCount?: number;

  /**  */
  sorting?: string;

  /**  */
  filter?: VersionFilterRequestDto;
}

export interface VersionFilterRequestDto {
  /**  */
  assetId?: string;

  /**  */
  includeTrash?: boolean;

  /**  */
  status?: UploadStatus;

  /**  */
  processingStatus?: ProcessingStatus;
}

export interface VersionCreateRequestDto {
  /**  */
  assetId?: string;

  /**  */
  fileName?: string;

  /**  */
  mimeType?: string;

  /**  */
  fileSize?: number;

  /**  */
  mediaType?: MediaType;

  /**  */
  compressionAlgo?: string;

  /**  */
  timeToLive?: number;

  /**  */
  changeNote?: string;

  /**  */
  assetStatus?: AssetStatus;
}

export interface CommonResponseVersionCreateResponseDto {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: VersionCreateResponseDto;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface VersionCreateResponseDto {
  /**  */
  version?: MetadataEntity;

  /**  */
  upload?: InitiateUploadResponseDto;
}

export interface AssetUpdateRequestDto {
  /**  */
  assetId?: string;

  /**  */
  assetName?: string;

  /**  */
  description?: string;

  /**  */
  shareExpiry?: Date;

  /**  */
  regenerateShareToken?: boolean;
}

export interface AssetEntity {
  /**  */
  createdBy?: string;

  /**  */
  createdByEmail?: string;

  /**  */
  updateBy?: string;

  /**  */
  updateByEmail?: string;

  /**  */
  isActive?: boolean;

  /**  */
  createdAt?: Date;

  /**  */
  updatedAt?: Date;

  /**  */
  assetId?: string;

  /**  */
  assetName?: string;

  /**  */
  description?: string;

  /**  */
  projectId?: string;

  /**  */
  folderId?: string;

  /**  */
  ownerId?: string;

  /**  */
  ownerEmail?: string;

  /**  */
  versionCount?: number;

  /**  */
  assetStatus?: AssetStatus;

  /**  */
  latestReviewSessionId?: string;

  /**  */
  shareToken?: string;

  /**  */
  shareExpiry?: Date;
}

export interface CommonResponseAssetEntity {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: AssetEntity;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface AssetMoveRequestDto {
  /**  */
  assetId?: string;

  /**  */
  targetFolderId?: string;
}

export interface AssetFilterRequestDto {
  /**  */
  projectId?: string;

  /**  */
  folderId?: string;

  /**  */
  mediaType?: MediaType;

  /**  */
  assetStatus?: AssetStatus;

  /**  */
  ownerId?: string;

  /**  */
  keyword?: string;

  /**  */
  isActive?: boolean;
}

export interface PageRequestDtoAssetFilterRequestDto {
  /**  */
  maxResultCount?: number;

  /**  */
  skipCount?: number;

  /**  */
  sorting?: string;

  /**  */
  filter?: AssetFilterRequestDto;
}

export interface AssetSummaryDto {
  /**  */
  asset?: AssetEntity;

  /**  */
  latestVersion?: MetadataEntity;
}

export interface CommonResponsePageResultAssetSummaryDto {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: PageResultAssetSummaryDto;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface PageResultAssetSummaryDto {
  /**  */
  totalCount?: string;

  /**  */
  data?: AssetSummaryDto[];
}

export interface AssetCreateRequestDto {
  /**  */
  projectId?: string;

  /**  */
  folderId?: string;

  /**  */
  assetName?: string;

  /**  */
  description?: string;

  /**  */
  fileName?: string;

  /**  */
  mimeType?: string;

  /**  */
  fileSize?: number;

  /**  */
  mediaType?: MediaType;

  /**  */
  compressionAlgo?: string;

  /**  */
  timeToLive?: number;
}

export interface AssetCreateResponseDto {
  /**  */
  asset?: AssetEntity;

  /**  */
  version?: MetadataEntity;

  /**  */
  upload?: InitiateUploadResponseDto;
}

export interface CommonResponseAssetCreateResponseDto {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: AssetCreateResponseDto;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface AnnotationPoint {
  /**  */
  x?: number;

  /**  */
  y?: number;
}

export interface AnnotationRegion {
  /**  */
  shape?: Shape;

  /**  */
  points?: AnnotationPoint[];

  /**  */
  strokeColor?: string;

  /**  */
  strokeWidth?: number;

  /**  */
  fillColor?: string;
}

export interface AnnotationTimeCode {
  /**  */
  startMs?: string;

  /**  */
  endMs?: string;
}

export interface AnnotationsCreateUpdateDTO {
  /**  */
  annotationId?: string;

  /**  */
  assetId?: string;

  /**  */
  versionId?: string;

  /**  */
  annotationType?: AnnotationType;

  /**  */
  timeCode?: AnnotationTimeCode;

  /**  */
  region?: AnnotationRegion;

  /**  */
  frameNumber?: number;

  /**  */
  status?: AnnotationStatus;

  /**  */
  threadId?: string;
}

export interface AnnotationsEntity {
  /**  */
  createdBy?: string;

  /**  */
  createdByEmail?: string;

  /**  */
  updateBy?: string;

  /**  */
  updateByEmail?: string;

  /**  */
  isActive?: boolean;

  /**  */
  createdAt?: Date;

  /**  */
  updatedAt?: Date;

  /**  */
  annotationId?: string;

  /**  */
  assetId?: string;

  /**  */
  versionId?: string;

  /**  */
  annotationType?: AnnotationType;

  /**  */
  timeCode?: AnnotationTimeCode;

  /**  */
  region?: AnnotationRegion;

  /**  */
  frameNumber?: number;

  /**  */
  status?: AnnotationStatus;

  /**  */
  resolvedAt?: Date;

  /**  */
  resolvedBy?: string;

  /**  */
  threadId?: string;
}

export interface CommonResponseAnnotationsEntity {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: AnnotationsEntity;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface AnnotationsFilterDTO {
  /**  */
  assetId?: string;

  /**  */
  versionId?: string;

  /**  */
  threadId?: string;

  /**  */
  annotationType?: AnnotationType;

  /**  */
  status?: AnnotationStatus;

  /**  */
  createdBy?: string;

  /**  */
  createdByEmail?: string;

  /**  */
  frameNumber?: number;

  /**  */
  fromStartMs?: string;

  /**  */
  toStartMs?: string;

  /**  */
  fromCreatedAt?: Date;

  /**  */
  toCreatedAt?: Date;
}

export interface PageRequestDtoAnnotationsFilterDTO {
  /**  */
  maxResultCount?: number;

  /**  */
  skipCount?: number;

  /**  */
  sorting?: string;

  /**  */
  filter?: AnnotationsFilterDTO;
}

export interface CommonResponsePageResultAnnotationsEntity {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: PageResultAnnotationsEntity;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface PageResultAnnotationsEntity {
  /**  */
  totalCount?: string;

  /**  */
  data?: AnnotationsEntity[];
}

export interface AssetDetailResponseDto {
  /**  */
  asset?: AssetEntity;

  /**  */
  latestVersion?: MetadataEntity;
}

export interface CommonResponseAssetDetailResponseDto {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: AssetDetailResponseDto;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export enum UserGrantedRole {
  'ROLE_USER' = 'ROLE_USER',
  'ROLE_ADMIN' = 'ROLE_ADMIN',
  'ROLE_SA' = 'ROLE_SA'
}

export enum AuthProvider {
  'LOCAL' = 'LOCAL',
  'GOOGLE' = 'GOOGLE'
}

export enum GrantedPermission {
  'OWNER' = 'OWNER',
  'REVIEWER' = 'REVIEWER',
  'PRODUCER' = 'PRODUCER',
  'GUEST' = 'GUEST',
  'VIEWER' = 'VIEWER'
}

export enum ProjectStatus {
  'ACTIVE' = 'ACTIVE',
  'ARCHIVED' = 'ARCHIVED',
  'COMPLETED' = 'COMPLETED'
}

export enum GrantedVisibility {
  'PUBLIC' = 'PUBLIC',
  'PRIVATE' = 'PRIVATE'
}

export enum DeliveryStatus {
  'PENDING' = 'PENDING',
  'SENT' = 'SENT',
  'FAILED' = 'FAILED',
  'SKIPPED' = 'SKIPPED',
  'DELIVERED' = 'DELIVERED'
}

export enum NotificationType {
  'NEW_COMMENT' = 'NEW_COMMENT',
  'MENTION' = 'MENTION',
  'STATUS_CHANGE' = 'STATUS_CHANGE',
  'NEW_VERSION' = 'NEW_VERSION',
  'REVIEW_INVITATION' = 'REVIEW_INVITATION',
  'ANNOTATION_RESOLVED' = 'ANNOTATION_RESOLVED',
  'DEADLINE_REMINDER' = 'DEADLINE_REMINDER'
}

export enum ObjectPermission {
  'READ' = 'READ',
  'COMMENT' = 'COMMENT',
  'MODIFY' = 'MODIFY'
}

export enum ObjectVisibility {
  'PRIVATE' = 'PRIVATE',
  'PUBLIC' = 'PUBLIC'
}

export enum FileAppPermission {
  'PUBLIC' = 'PUBLIC',
  'READ' = 'READ',
  'COMMENT' = 'COMMENT',
  'MODIFY' = 'MODIFY',
  'OWNER' = 'OWNER'
}

export enum MediaType {
  'IMAGE' = 'IMAGE',
  'VIDEO' = 'VIDEO',
  'DESIGN' = 'DESIGN'
}

export enum ProcessingStatus {
  'PENDING' = 'PENDING',
  'PROCESSING' = 'PROCESSING',
  'READY' = 'READY',
  'FAILED' = 'FAILED'
}

export enum UploadStatus {
  'UPLOADING' = 'UPLOADING',
  'COMPLETED' = 'COMPLETED',
  'FAILED' = 'FAILED'
}

export enum CommentAttachmentType {
  'IMAGE' = 'IMAGE',
  'FILE' = 'FILE'
}

export enum ThreadStatus {
  'OPEN' = 'OPEN',
  'RESOLVED' = 'RESOLVED'
}

export enum AssetStatus {
  'DRAFT' = 'DRAFT',
  'IN_REVIEW' = 'IN_REVIEW',
  'APPROVED' = 'APPROVED',
  'REQUEST_CHANGES' = 'REQUEST_CHANGES'
}

export enum AnnotationStatus {
  'OPEN' = 'OPEN',
  'RESOLVED' = 'RESOLVED'
}

export enum AnnotationType {
  'TIMECODE' = 'TIMECODE',
  'REGION' = 'REGION',
  'FRAME_REGION' = 'FRAME_REGION'
}

export enum Shape {
  'RECTANGLE' = 'RECTANGLE',
  'CIRCLE' = 'CIRCLE',
  'POLYGON' = 'POLYGON',
  'FREEFORM' = 'FREEFORM'
}
