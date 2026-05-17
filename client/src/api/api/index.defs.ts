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

export interface ProjectVisibilityUpdateDTO {
  /**  */
  visibility?: GrantedVisibility;
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
  projectRole?: GrantedProjectRole;

  /**  */
  projectPermissions?: GrantedProjectPermission[];

  /**  */
  addedAt?: Date;
}

export interface ProjectEntity {
  /**  */
  isTrash?: boolean;

  /**  */
  trashedAt?: Date;

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

export interface ProjectStatusUpdateDTO {
  /**  */
  status?: ProjectStatus;
}

export interface ShareTokenCreateDTO {
  /**  */
  rangeTime?: ShareTokenTime;

  /**  */
  expireDate?: Date;

  /**  */
  projectId?: string;
}

export interface CommonResponseShareTokenCreateResponseDTO {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: ShareTokenCreateResponseDTO;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface ShareTokenCreateResponseDTO {
  /**  */
  shareToken?: string;

  /**  */
  message?: string;
}

export interface ProjectCollaboratorDTO {
  /**  */
  projectId?: string;

  /**  */
  email?: string;

  /**  */
  userId?: string;

  /**  */
  projectRole?: GrantedProjectRole;
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
  visibility?: GrantedVisibility;

  /**  */
  status?: ProjectStatus;
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
  versionNumber?: number;

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
  isTrash?: boolean;

  /**  */
  trashedAt?: Date;

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
  restrictedUserIds?: string[];
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
  isTrash?: boolean;

  /**  */
  trashedAt?: Date;

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
  ancestorIds?: string[];

  /**  */
  level?: number;

  /**  */
  userPermissions?: FolderPermission[];

  /**  */
  visibility?: FolderVisibility;

  /**  */
  stats?: FolderStats;

  /**  */
  shareToken?: string;

  /**  */
  shareExpiry?: Date;
}

export interface FolderPermission {
  /**  */
  userId?: string;

  /**  */
  permissions?: GrantedProjectPermission[];

  /**  */
  isPrivateCollaborator?: boolean;

  /**  */
  grantedAt?: Date;
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

  /**  */
  isTrash?: boolean;
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
  rootFolderName?: string;

  /**  */
  folders?: FolderTreeNodeDTO[];
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

  /**  */
  visibility?: FolderVisibility;
}

export interface FolderChangeVisibilityRequestDTO {
  /**  */
  folderId?: string;

  /**  */
  visibility?: FolderVisibility;

  /**  */
  restrictedUserIds?: string[];
}

export interface CommonResponseFolderArchiveResponseDTO {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: FolderArchiveResponseDTO;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface FolderArchiveResponseDTO {
  /**  */
  archivedFolderIds?: string[];

  /**  */
  archivedAssetIds?: string[];
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
  isTrash?: boolean;

  /**  */
  trashedAt?: Date;

  /**  */
  renditionCount?: number;

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
  assetId?: string;

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
  versionNumber?: number;

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
  isTrash?: boolean;

  /**  */
  trashedAt?: Date;

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
  versionNumber?: number;

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
  versionNumber?: number;

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
  assetId?: string;

  /**  */
  versionNumber?: number;

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

export interface AssetCreateRequestDto {
  /**  */
  projectId?: string;

  /**  */
  folderId?: string;

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

  /**  */
  assetId?: string;

  /**  */
  changeNote?: string;

  /**  */
  assetStatus?: AssetStatus;
}

export interface AssetCreateResponseDto {
  /**  */
  asset?: AssetEntity;

  /**  */
  version?: MetadataEntity;

  /**  */
  upload?: InitiateUploadResponseDto;
}

export interface AssetEntity {
  /**  */
  isTrash?: boolean;

  /**  */
  trashedAt?: Date;

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
  mediaType?: MediaType;

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
  versionNumber?: number;

  /**  */
  annotationType?: AnnotationType;

  /**  */
  timeCode?: AnnotationTimeCode;

  /**  */
  frameNumber?: number;

  /**  */
  region?: AnnotationRegion;

  /**  */
  status?: AnnotationStatus;

  /**  */
  threadId?: string;
}

export interface AnnotationsEntity {
  /**  */
  isTrash?: boolean;

  /**  */
  trashedAt?: Date;

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
  versionNumber?: number;

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
  versionNumber?: number;

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

export interface CommonResponseProcessingJobEntity {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: ProcessingJobEntity;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface ProcessingJobConfig {
  /**  */
  profiles?: string[];

  /**  */
  intervalSeconds?: number;

  /**  */
  maxThumbnails?: number;

  /**  */
  scanEngine?: string;
}

export interface ProcessingJobEntity {
  /**  */
  isTrash?: boolean;

  /**  */
  trashedAt?: Date;

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
  jobId?: string;

  /**  */
  metadataId?: string;

  /**  */
  versionNumber?: number;

  /**  */
  assetId?: string;

  /**  */
  jobType?: ProcessingJobType;

  /**  */
  config?: ProcessingJobConfig;

  /**  */
  status?: ProcessingJobStatus;

  /**  */
  priority?: number;

  /**  */
  progress?: ProcessingJobProgress;

  /**  */
  result?: ProcessingJobResult;

  /**  */
  scheduledAt?: Date;

  /**  */
  startedAt?: Date;

  /**  */
  completedAt?: Date;

  /**  */
  retryCount?: number;

  /**  */
  maxRetries?: number;

  /**  */
  lastError?: string;

  /**  */
  workerId?: string;

  /**  */
  workerHeartbeat?: Date;
}

export interface ProcessingJobProgress {
  /**  */
  percent?: number;

  /**  */
  currentStep?: string;

  /**  */
  estimatedTimeRemainingMs?: string;
}

export interface ProcessingJobResult {
  /**  */
  success?: boolean;

  /**  */
  outputKeys?: string[];

  /**  */
  errorMessage?: string;

  /**  */
  errorDetails?: object;
}

export interface CommonResponseListMediaRenditionEntity {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: MediaRenditionEntity[];

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface MediaRenditionEntity {
  /**  */
  isTrash?: boolean;

  /**  */
  trashedAt?: Date;

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
  renditionId?: string;

  /**  */
  metadataId?: string;

  /**  */
  versionNumber?: number;

  /**  */
  assetId?: string;

  /**  */
  renditionType?: RenditionType;

  /**  */
  profile?: string;

  /**  */
  manifestKey?: string;

  /**  */
  segmentPathPrefix?: string;

  /**  */
  bandwidth?: string;

  /**  */
  resolution?: RenditionResolution;

  /**  */
  thumbnailCount?: number;

  /**  */
  intervalMs?: string;

  /**  */
  spriteKey?: string;

  /**  */
  spriteMetadataKey?: string;

  /**  */
  posterKey?: string;

  /**  */
  posterTimestamp?: string;

  /**  */
  fileSize?: string;

  /**  */
  status?: RenditionStatus;
}

export interface RenditionResolution {
  /**  */
  width?: number;

  /**  */
  height?: number;
}

export interface CommonResponsePlaybackDataResponseDto {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: PlaybackDataResponseDto;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface PlaybackDataResponseDto {
  /**  */
  versionNumber?: number;

  /**  */
  assetId?: string;

  /**  */
  processingStatus?: ProcessingStatus;

  /**  */
  manifestKey?: string;

  /**  */
  posterKey?: string;

  /**  */
  spriteKey?: string;

  /**  */
  spriteMetadataKey?: string;

  /**  */
  imageUrl?: string;
}

export interface CommonResponseProjectStats {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: ProjectStats;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface CommonResponseListProjectCollaborator {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: ProjectCollaborator[];

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface AuditLogFilterDTO {
  /**  */
  actorId?: string;

  /**  */
  actorEmail?: string;

  /**  */
  action?: AuditAction;

  /**  */
  fromTimestamp?: Date;

  /**  */
  toTimestamp?: Date;
}

export interface PageRequestDtoAuditLogFilterDTO {
  /**  */
  maxResultCount?: number;

  /**  */
  skipCount?: number;

  /**  */
  sorting?: string;

  /**  */
  filter?: AuditLogFilterDTO;
}

export interface AuditChanges {
  /**  */
  before?: object;

  /**  */
  after?: object;
}

export interface AuditLogEntity {
  /**  */
  isTrash?: boolean;

  /**  */
  trashedAt?: Date;

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
  logId?: string;

  /**  */
  actorId?: string;

  /**  */
  actorEmail?: string;

  /**  */
  actorType?: AuditActorType;

  /**  */
  action?: AuditAction;

  /**  */
  targetType?: AuditTargetType;

  /**  */
  targetId?: string;

  /**  */
  targetName?: string;

  /**  */
  assetId?: string;

  /**  */
  versionNumber?: number;

  /**  */
  reviewSessionId?: string;

  /**  */
  changes?: AuditChanges;

  /**  */
  requestInfo?: AuditRequestInfo;

  /**  */
  timestamp?: Date;

  /**  */
  expiresAt?: Date;
}

export interface AuditRequestInfo {
  /**  */
  ipAddress?: string;

  /**  */
  userAgent?: string;

  /**  */
  requestId?: string;
}

export interface CommonResponsePageResultAuditLogEntity {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: PageResultAuditLogEntity;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface PageResultAuditLogEntity {
  /**  */
  totalCount?: string;

  /**  */
  data?: AuditLogEntity[];
}

export interface CommonResponseShareTokenInfoDTO {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: ShareTokenInfoDTO;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface ShareTokenInfoDTO {
  /**  */
  shareToken?: string;

  /**  */
  shareExpiry?: Date;

  /**  */
  projectId?: string;

  /**  */
  projectName?: string;

  /**  */
  visibility?: GrantedVisibility;
}

export interface CommonResponseProcessingStatusResponseDto {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: ProcessingStatusResponseDto;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface ProcessingStatusResponseDto {
  /**  */
  versionNumber?: number;

  /**  */
  processingStatus?: ProcessingStatus;

  /**  */
  jobStatus?: ProcessingJobStatus;

  /**  */
  progress?: ProcessingJobProgress;

  /**  */
  errorMessage?: string;
}

export interface CommonResponseFolderTreeResponseDTO {
  /**  */
  isSuccessful?: boolean;

  /**  */
  data?: FolderTreeResponseDTO;

  /**  */
  code?: string;

  /**  */
  message?: string;
}

export interface FolderBreadcrumbItemDTO {
  /**  */
  folderId?: string;

  /**  */
  folderName?: string;

  /**  */
  level?: number;
}

export interface FolderTreeItemDTO {
  /**  */
  folderId?: string;

  /**  */
  projectId?: string;

  /**  */
  parentFolderId?: string;

  /**  */
  folderName?: string;

  /**  */
  ancestorIds?: string[];

  /**  */
  level?: number;

  /**  */
  visibility?: FolderVisibility;

  /**  */
  stats?: FolderStats;
}

export interface FolderTreeResponseDTO {
  /**  */
  projectId?: string;

  /**  */
  breadcrumb?: FolderBreadcrumbItemDTO[];

  /**  */
  tree?: FolderTreeItemDTO[];
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

export enum GrantedVisibility {
  'PUBLIC' = 'PUBLIC',
  'PRIVATE' = 'PRIVATE'
}

export enum GrantedProjectPermission {
  'READ' = 'READ',
  'SELECT_AND_SUBMIT' = 'SELECT_AND_SUBMIT',
  'DOWNLOAD' = 'DOWNLOAD',
  'COMMENT' = 'COMMENT',
  'CREATE_FOLDER_ASSET' = 'CREATE_FOLDER_ASSET',
  'UPDATE' = 'UPDATE',
  'ARCHIVE' = 'ARCHIVE',
  'DELETE' = 'DELETE',
  'ADD_USER' = 'ADD_USER',
  'PROJECT_APPROVE' = 'PROJECT_APPROVE',
  'AUDIT_LOG' = 'AUDIT_LOG'
}

export enum GrantedProjectRole {
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

export enum ShareTokenTime {
  'ONE_DAY' = 'ONE_DAY',
  'ONE_WEEK' = 'ONE_WEEK',
  'ONE_MONTH' = 'ONE_MONTH',
  'ONE_YEAR' = 'ONE_YEAR',
  'UNLIMITED' = 'UNLIMITED'
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

export enum FolderVisibility {
  'INHERIT' = 'INHERIT',
  'RESTRICTED' = 'RESTRICTED',
  'PUBLIC' = 'PUBLIC'
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
  'FREEFORM' = 'FREEFORM',
  'DOT' = 'DOT'
}

export enum ProcessingJobStatus {
  'PENDING' = 'PENDING',
  'PROCESSING' = 'PROCESSING',
  'COMPLETED' = 'COMPLETED',
  'FAILED' = 'FAILED',
  'CANCELLED' = 'CANCELLED'
}

export enum ProcessingJobType {
  'TRANSCODE_HLS' = 'TRANSCODE_HLS',
  'GENERATE_THUMBNAILS' = 'GENERATE_THUMBNAILS',
  'GENERATE_SPRITE' = 'GENERATE_SPRITE',
  'GENERATE_POSTER' = 'GENERATE_POSTER',
  'GENERATE_WAVEFORM' = 'GENERATE_WAVEFORM',
  'VIRUS_SCAN' = 'VIRUS_SCAN'
}

export enum RenditionStatus {
  'PENDING' = 'PENDING',
  'PROCESSING' = 'PROCESSING',
  'READY' = 'READY',
  'FAILED' = 'FAILED'
}

export enum RenditionType {
  'HLS' = 'HLS',
  'THUMBNAIL' = 'THUMBNAIL',
  'SPRITE' = 'SPRITE',
  'WAVEFORM' = 'WAVEFORM',
  'POSTER' = 'POSTER'
}

export enum AuditAction {
  'CREATE' = 'CREATE',
  'UPDATE' = 'UPDATE',
  'TRASH' = 'TRASH',
  'DELETE' = 'DELETE',
  'STATUS_CHANGE' = 'STATUS_CHANGE',
  'PERMISSION_CHANGE' = 'PERMISSION_CHANGE',
  'LOGIN' = 'LOGIN',
  'LOGOUT' = 'LOGOUT',
  'SHARE' = 'SHARE',
  'DOWNLOAD' = 'DOWNLOAD',
  'UPLOAD_COMPLETE' = 'UPLOAD_COMPLETE',
  'UPLOAD_NEW_VERSION' = 'UPLOAD_NEW_VERSION'
}

export enum AuditActorType {
  'USER' = 'USER',
  'SYSTEM' = 'SYSTEM',
  'API_KEY' = 'API_KEY'
}

export enum AuditTargetType {
  'PROJECT' = 'PROJECT',
  'FOLDER' = 'FOLDER',
  'FILE' = 'FILE',
  'ASSET' = 'ASSET',
  'ANNOTATION' = 'ANNOTATION',
  'COMMENT' = 'COMMENT',
  'REVIEW_SESSION' = 'REVIEW_SESSION',
  'USER' = 'USER',
  'PERMISSION' = 'PERMISSION'
}
