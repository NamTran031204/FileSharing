export type UploadStatus = 'UPLOADING' | 'COMPLETED' | 'FAILED';

export type ObjectPermission = 'READ' | 'COMMENT' | 'MODIFY';

export type ObjectVisibility = 'PRIVATE' | 'PUBLIC';

export type AuthProvider = 'LOCAL' | 'GOOGLE';

export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN';

export type ErrorCode =
    | '200'
    | '400'
    | '401'
    | '403'
    | '404'
    | '500'
    | '510'
    | '5101'
    | '5104'
    | '5202'
    | '5203'
    | '5204'
    | '5205';