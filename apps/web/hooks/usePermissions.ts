import { useAuthStore } from './useAuth';

export function usePermissions() {
  const user = useAuthStore((state) => state.user);

  const hasRole = (role: string): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.includes('SUPER_ADMIN') || user.roles.includes(role);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user || !user.roles) return false;
    if (user.roles.includes('SUPER_ADMIN')) return true;
    return roles.some((r) => user.roles.includes(r));
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.roles?.includes('SUPER_ADMIN')) return true;
    return user.permissions?.includes(permission) || false;
  };

  return {
    user,
    hasRole,
    hasAnyRole,
    hasPermission,
  };
}
