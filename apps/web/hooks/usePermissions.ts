import { useAuthStore } from './useAuth';

export function usePermissions() {
  const { user, isInitializing, isAuthenticated } = useAuthStore();

  const getNormalizedRoles = (): string[] => {
    if (!user || !user.roles || !Array.isArray(user.roles)) return [];
    return user.roles.map((r) => {
      if (typeof r === 'string') return r;
      if (r && typeof r === 'object' && typeof r.name === 'string') return r.name;
      return '';
    }).filter(Boolean);
  };

  const hasExactRole = (role: string): boolean => {
    const roles = getNormalizedRoles();
    return roles.includes(role);
  };

  const hasRole = (role: string): boolean => {
    const roles = getNormalizedRoles();
    if (roles.length === 0) return false;
    return roles.includes('ADMIN') || roles.includes(role);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    const userRoles = getNormalizedRoles();
    if (userRoles.length === 0) return false;
    if (userRoles.includes('ADMIN')) return true;
    return roles.some((r) => userRoles.includes(r));
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const userRoles = getNormalizedRoles();
    if (userRoles.includes('ADMIN')) return true;
    return user.permissions?.includes(permission) || false;
  };

  return {
    user,
    isInitializing,
    isAuthenticated,
    roles: getNormalizedRoles(),
    hasExactRole,
    hasRole,
    hasAnyRole,
    hasPermission,
  };
}
