import { observer } from 'mobx-react-lite';
import type { ReactNode } from 'react';
import { useStore } from '../../../store';
import { checkPermissionUser } from '../../../utils/auth.utils.ts';

interface RequiredPermissionProps {
  permissionName: string;
  children?: ReactNode;
  fallback?: ReactNode;
}

const RequiredPermission = observer(function RequiredPermission({
  permissionName,
  children,
  fallback = null,
}: RequiredPermissionProps) {
  const { sessionStore } = useStore();
  const granted = checkPermissionUser(sessionStore.appSession, permissionName);
  return <>{granted ? children : fallback}</>;
});

export default RequiredPermission;
