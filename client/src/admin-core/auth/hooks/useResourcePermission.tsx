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

const ROLE = 'ROLE_SA';

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
export const useResourcePermission = (_permissionBase?: string): ResourcePermissionResult => {
    const appSession = useSessionStore(s => s.appSession);
    const ok = checkPermissionUser(appSession, ROLE);
    return {canCreate: ok, canUpdate: ok, canDelete: ok, canGetDetail: ok, canImport: false, canExport: false};
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
export const usePermissionStrings = (_permissionBase?: string) => {
    const permissions = {
        create: ROLE, update: ROLE, delete: ROLE, getDetail: ROLE, getList: ROLE, detail: ROLE, list: ROLE,
        import: ROLE, export: ROLE,
    };
    return {permissions};
};
