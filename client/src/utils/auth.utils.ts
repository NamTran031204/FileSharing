import type { AppSessionDto } from '../store/sessionStore';


export const checkPermissionUser = (
  session: AppSessionDto | undefined,
  permissionName?: string,
): boolean => {
  if (!session?.isLogined) return false;
  if (!permissionName) return true;
  return session.permissionGranted?.[permissionName] === true;
};
