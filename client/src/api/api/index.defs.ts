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
  roles?: UserRole[];

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
  roles?: UserRole[];

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
  emails?: string[];

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
  role?: ProjectCollaboratorRole;

  /**  */
  addedAt?: Date;
}

export interface ProjectEntity {
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
  stats?: ProjectStats;

  /**  */
  status?: ProjectStatus;

  /**  */
  isActive?: boolean;

  /**  */
  trashedAt?: Date;

  /**  */
  createdAt?: Date;

  /**  */
  updatedAt?: Date;
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

  /**  */
  isActive?: boolean;
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
  isActive?: boolean;

  /**  */
  createdBy?: string;

  /**  */
  createdAt?: Date;

  /**  */
  updatedAt?: Date;
}

export interface FolderPermission {
  /**  */
  userId?: string;

  /**  */
  permissions?: ObjectPermission[];

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

export interface PageRequestDtoMapStringObject {
  /**  */
  maxResultCount?: number;

  /**  */
  skipCount?: number;

  /**  */
  sorting?: string;

  /**  */
  filter?: object;
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

export enum UserRole {
  'ROLE_USER' = 'ROLE_USER',
  'ROLE_ADMIN' = 'ROLE_ADMIN'
}

export enum AuthProvider {
  'LOCAL' = 'LOCAL',
  'GOOGLE' = 'GOOGLE'
}

export enum ProjectStatus {
  'ACTIVE' = 'ACTIVE',
  'ARCHIVED' = 'ARCHIVED',
  'COMPLETED' = 'COMPLETED'
}

export enum ProjectCollaboratorRole {
  'PRODUCER' = 'PRODUCER',
  'REVIEWER' = 'REVIEWER',
  'VIEWER' = 'VIEWER'
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
