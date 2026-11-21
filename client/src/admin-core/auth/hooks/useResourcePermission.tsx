import {checkPermissionUser} from '../utils/auth.utils';
import {useSessionStore} from '../../shared/store/useSessionStore';

export type PermissionAction = 'create' | 'update' | 'delete' | 'getDetail' | 'import' | 'export' | string;

export interface ResourcePermissionResult {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canGetDetail: boolean;
    canImport: boolean;
    canExport: boolean;
}

// permission co dang "<permissionBase>.<Action>" (vd Admin.User.Create); FE khong bypass cho ROLE_SA, backend da tra du catalogue cho SA
const per = (base: string | undefined, action: string) => `${base}.${action}`;

export const useResourcePermission = (permissionBase?: string): ResourcePermissionResult => {
    const appSession = useSessionStore(s => s.appSession);
    const can = (action: string) => !!permissionBase && checkPermissionUser(appSession, per(permissionBase, action));
    return {
        canCreate: can('Create'), canUpdate: can('Update'), canDelete: can('Delete'), canGetDetail: can('GetDetail'),
        canImport: can('Import'), canExport: can('Export'),
    };
};

export const usePermissionStrings = (permissionBase?: string) => {
    const permissions = {
        create: per(permissionBase, 'Create'), update: per(permissionBase, 'Update'), delete: per(permissionBase, 'Delete'),
        getDetail: per(permissionBase, 'GetDetail'), getList: per(permissionBase, 'GetPaged'),
        detail: per(permissionBase, 'GetDetail'), list: per(permissionBase, 'GetPaged'),
        import: per(permissionBase, 'Import'), export: per(permissionBase, 'Export'),
    };
    return {permissions};
};
