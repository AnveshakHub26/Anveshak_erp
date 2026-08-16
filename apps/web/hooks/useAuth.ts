import { create } from 'zustand';

export interface UserProfile {
  id: string;
  email: string;
  status: string;
  roles: any[];
  permissions?: string[];
  organization?: any;
  mustChangePassword?: boolean;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setAuth: (user: UserProfile, token?: string) => void;
  logout: () => void;
  initializeSession: () => void;
}

const normalizeRoles = (rawRoles: any[]): string[] => {
  if (!Array.isArray(rawRoles)) return [];
  return rawRoles
    .map((r: any) => {
      let val = '';
      if (typeof r === 'string') val = r;
      else if (r && typeof r === 'object') {
        val = r.code || r.name || r.role?.code || r.role?.name || '';
      }
      return typeof val === 'string' ? val.toUpperCase() : '';
    })
    .filter(Boolean);
};

const getInitialState = () => {
  return { user: null, token: null, isAuthenticated: false, isInitializing: true };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...getInitialState(),
  setAuth: (rawUser, token) => {
    const roles = normalizeRoles(rawUser?.roles);
    const user = { ...rawUser, roles };
    const currentToken = token ?? get().token ?? (typeof window !== 'undefined' ? localStorage.getItem('token') : null) ?? '';
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('token', currentToken);
        localStorage.setItem('user', JSON.stringify(user));
      } catch (err) {
        console.error('Failed to save session to localStorage:', err);
      }
    }
    set({ user, token: currentToken, isAuthenticated: true, isInitializing: false });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (err) {
        console.error('Failed to clear session from localStorage:', err);
      }
      set({ user: null, token: null, isAuthenticated: false, isInitializing: false });
      window.location.href = '/';
    }
  },
  initializeSession: () => {
    if (typeof window === 'undefined') {
      set({ isInitializing: false });
      return;
    }
    try {
      const storedToken = localStorage.getItem('token');
      const storedUserRaw = localStorage.getItem('user');
      if (storedToken && storedUserRaw) {
        const parsedUser = JSON.parse(storedUserRaw);
        if (parsedUser) {
          parsedUser.roles = normalizeRoles(parsedUser.roles);
          localStorage.setItem('user', JSON.stringify(parsedUser));
        }
        set({ user: parsedUser, token: storedToken, isAuthenticated: true, isInitializing: false });
      } else {
        set({ user: null, token: null, isAuthenticated: false, isInitializing: false });
      }
    } catch {
      set({ user: null, token: null, isAuthenticated: false, isInitializing: false });
    }
  },
}));
