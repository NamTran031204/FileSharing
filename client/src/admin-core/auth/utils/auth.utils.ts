import {checkPermissionUser as baseCheck} from '../../../utils/auth.utils';
import type {AppSessionDto} from '../../../store/sessionStore';

// Cho phep nhan ca AppBootstrapDto (code clone) lan AppSessionDto cua FileSharing.
export const checkPermissionUser = (session: unknown, permissionName?: string): boolean =>
    baseCheck(session as AppSessionDto | undefined, permissionName);
