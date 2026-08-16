import { useCallback, useMemo } from 'react';
import { useAuthStore } from './useAuth';

export function usePermissions() {
  const { user, isInitializing, isAuthenticated } = useAuthStore();

  const userRolesRaw = user?.roles;
  const userPermissionsRaw = user?.permissions;

  const roles = useMemo((): string[] => {
    if (!userRolesRaw || !Array.isArray(userRolesRaw)) return [];
    return userRolesRaw
      .map((r) => {
        let val = '';
        if (typeof r === 'string') val = r;
        else if (r && typeof r === 'object') {
          val = r.code || r.name || r.role?.code || r.role?.name || '';
        }
        return typeof val === 'string' ? val.toUpperCase() : '';
      })
      .filter(Boolean);
  }, [userRolesRaw]);

  const hasExactRole = useCallback(
    (role: string): boolean => {
      return roles.includes(role.toUpperCase());
    },
    [roles],
  );

  const hasRole = useCallback(
    (role: string): boolean => {
      if (roles.length === 0) return false;
      return roles.includes('ADMIN') || roles.includes(role.toUpperCase());
    },
    [roles],
  );

  const hasAnyRole = useCallback(
    (targetRoles: string[]): boolean => {
      if (roles.length === 0) return false;
      if (roles.includes('ADMIN')) return true;
      const upperTargets = targetRoles.map((t) => t.toUpperCase());
      return upperTargets.some((r) => roles.includes(r));
    },
    [roles],
  );

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (roles.includes('ADMIN')) return true;
      return userPermissionsRaw?.includes(permission) || false;
    },
    [user, roles, userPermissionsRaw],
  );

  return {
    user,
    isInitializing,
    isAuthenticated,
    roles,
    hasExactRole,
    hasRole,
    hasAnyRole,
    hasPermission,
  };
}
