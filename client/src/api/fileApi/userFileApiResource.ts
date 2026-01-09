import baseApi, {type PageRequest, type PageResult} from '../baseApi';
import {FileAppPermission, type ObjectPermission, type ObjectVisibility, type UploadStatus} from "../enums.ts";


export interface UserFilePermission {
    email: string;
    permissionList: ObjectPermission[];
}

export interface MetadataEntity {
    fileId: string;
    fileName: string;
    objectName: string;
    mimeType: string;
    fileSize: number;
    compressionAlgo: string;
    ownerId: string;
    uploadId: string;
    status: UploadStatus;
    timeToLive: number;
    isActive: boolean;

    isTrash: boolean;
    shareToken: string;

    publishUserPermission: FileAppPermission;

    publicPermission: ObjectPermission;
    visibility: ObjectVisibility;
    userFilePermissions: UserFilePermission[];

    creationTimestamp: string;
    modificationTimestamp: string;
}

export interface UserFileFilterPageRequestDto {
    mimeType: string | null;
    status: UploadStatus | null;
    isActive: boolean | null;
    isTrash: boolean | null;
    isIncludeSharedFile: boolean | null;
    creationTimestampStartDate: string | null;
    creationTimestampEndDate: string | null;
}

export interface MetadataUpdateRequestDto {
    fileName: string;
    timeToLive: number;
    publicPermission: ObjectPermission;
    visibility: ObjectVisibility;
    userFilePermissions: UserFilePermission[];
}

export interface EmailSenderRequestDto {
    toEmail: string;
    objectPermission: ObjectPermission[];
    uploadLink: string;
    objectName: string;
}

const userFileApiResource = {
    getFileByData: (data: PageRequest<UserFileFilterPageRequestDto>) =>
        baseApi.post<PageResult<MetadataEntity>>('/file/get-page', data),

    sendEmail: async (data: EmailSenderRequestDto) =>
        baseApi.post<string>('/file/send-email', data),

    updateFileDetail: async (fileId: string, data: MetadataUpdateRequestDto) =>
        baseApi.post<MetadataEntity>(`/file/update/${fileId}`, data),
}


export default userFileApiResource;