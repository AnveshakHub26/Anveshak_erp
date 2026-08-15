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
        if (typeof r === 'string') return r;
        if (r && typeof r === 'object' && typeof r.name === 'string') return r.name;
        return '';
      })
      .filter(Boolean);
  }, [userRolesRaw]);

  const hasExactRole = useCallback(
    (role: string): boolean => {
      return roles.includes(role);
    },
    [roles],
  );

  const hasRole = useCallback(
    (role: string): boolean => {
      if (roles.length === 0) return false;
      return roles.includes('ADMIN') || roles.includes(role);
    },
    [roles],
  );

  const hasAnyRole = useCallback(
    (targetRoles: string[]): boolean => {
      if (roles.length === 0) return false;
      if (roles.includes('ADMIN')) return true;
      return targetRoles.some((r) => roles.includes(r));
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
