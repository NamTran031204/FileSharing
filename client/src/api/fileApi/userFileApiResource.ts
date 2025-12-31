import baseApi, {type PageRequest, type PageResult} from '../baseApi';
import {type ObjectPermission, type ObjectVisibility, type UploadStatus} from "../enums.ts";


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
    isIncludeSharedFile: boolean | null;
    creationTimestampStartDate: string | null;
    creationTimestampEndDate: string | null;
}

export interface EmailSenderRequestDto {
    toEmail: string;
    uploadLink: string;
    objectName: string;
}

const userFileApiResource = {
    getFileByData: (data: PageRequest<UserFileFilterPageRequestDto>) =>
        baseApi.post<PageResult<MetadataEntity>>('/file/get-page', data),

    sendEmail: async (data: EmailSenderRequestDto) =>
        baseApi.post<string>('/file/send-email', data),
}


export default userFileApiResource;