export enum ObjectPermission {
    READ = 'READ',
    COMMENT = 'COMMENT',
    MODIFY = 'MODIFY'
}

export enum ObjectVisibility {
    PRIVATE = 'PRIVATE',
    PUBLIC = 'PUBLIC'
}

export enum UploadStatus {
    UPLOADING = 'UPLOADING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export enum AuthProvider {
    LOCAL = 'LOCAL',
    GOOGLE = 'GOOGLE'
}

export enum UserRole {
    ROLE_USER = 'ROLE_USER',
    ROLE_ADMIN = 'ROLE_ADMIN'
}

export enum FileAppPermission {
    READ = 'READ',
    COMMENT = 'COMMENT',
    MODIFY = 'MODIFY',
    PUBLIC = 'PUBLIC',
    OWNER = 'OWNER'
}

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