import {FileAppPermission, ObjectPermission} from '../api/enums';

/**
 * Permission hierarchy mapping
 * Số càng lớn = quyền càng cao
 */
const PERMISSION_LEVELS: Record<FileAppPermission, number> = {
    [FileAppPermission.PUBLIC]: 0,
    [FileAppPermission.READ]: 1,
    [FileAppPermission.COMMENT]: 2,
    [FileAppPermission.MODIFY]: 3,
    [FileAppPermission.OWNER]: 4,
};

export const hasPermission = (
    current: FileAppPermission,
    required: FileAppPermission
): boolean => {
    return PERMISSION_LEVELS[current] >= PERMISSION_LEVELS[required];
};

export const mapAppPermissionToObjectPermission = (
    appPermission: FileAppPermission
): ObjectPermission | null => {
    switch (appPermission) {
        case FileAppPermission.READ:
            return ObjectPermission.READ;
        case FileAppPermission.COMMENT:
            return ObjectPermission.COMMENT;
        case FileAppPermission.MODIFY:
            return ObjectPermission.MODIFY;
        case FileAppPermission.OWNER:
            return ObjectPermission.MODIFY;
        default:
            return null;
    }
};

export const getAvailableObjectPermissions = (
    currentAppPermission: FileAppPermission
): ObjectPermission[] => {
    const maxPermission = mapAppPermissionToObjectPermission(currentAppPermission);
    
    if (!maxPermission) {
        return [];
    }

    const allPermissions = [
        ObjectPermission.READ,
        ObjectPermission.COMMENT,
        ObjectPermission.MODIFY
    ];

    const maxLevel = PERMISSION_LEVELS[currentAppPermission];

    // Filter permissions based on hierarchy
    return allPermissions.filter(permission => {
        switch (permission) {
            case ObjectPermission.READ:
                return maxLevel >= PERMISSION_LEVELS[FileAppPermission.READ];
            case ObjectPermission.COMMENT:
                return maxLevel >= PERMISSION_LEVELS[FileAppPermission.COMMENT];
            case ObjectPermission.MODIFY:
                return maxLevel >= PERMISSION_LEVELS[FileAppPermission.MODIFY];
            default:
                return false;
        }
    });
};

export const isOwner = (permission: FileAppPermission): boolean => {
    return permission === FileAppPermission.OWNER;
};

export const canEdit = (permission: FileAppPermission): boolean => {
    return hasPermission(permission, FileAppPermission.MODIFY);
};

export const canDelete = (permission: FileAppPermission): boolean => {
    return isOwner(permission);
};

export const canShare = (permission: FileAppPermission): boolean => {
    return hasPermission(permission, FileAppPermission.MODIFY);
};

export const canViewDetails = (permission: FileAppPermission): boolean => {
    return hasPermission(permission, FileAppPermission.READ);
};

export const canSendEmail = (permission: FileAppPermission): boolean => {
    return hasPermission(permission, FileAppPermission.READ);
};

export const canRemoveUser = (permission: FileAppPermission): boolean => {
    return isOwner(permission);
};

export const canAddUser = (permission: FileAppPermission): boolean => {
    return hasPermission(permission, FileAppPermission.MODIFY);
};
