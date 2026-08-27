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
  isAuthenticated: boolean;
  isInitializing: boolean;
  setAuth: (user: UserProfile) => void;
  logout: () => void;
  initializeSession: () => void;
  clearSession: () => void;
}

export const normalizeRoles = (rawRoles: any[]): string[] => {
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

export function getDefaultRedirectForUser(user: UserProfile | null): string {
  if (!user) return '/login';
  const roles = normalizeRoles(user.roles);
  if (roles.includes('ADMIN')) return '/admin/approvals';
  if (roles.includes('HR')) return '/hr';
  if (roles.includes('ORG_USER')) return '/industry';
  if (
    roles.includes('EMPLOYEE') ||
    roles.includes('PM') ||
    roles.includes('EXPERT') ||
    roles.includes('INTERN') ||
    roles.includes('STAFF') ||
    roles.includes('EXECUTIVE')
  ) {
    return '/employee/dashboard';
  }
  return '/projects';
}

const getInitialState = () => {
  return { user: null, isAuthenticated: false, isInitializing: true };
};

export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialState(),

  /**
   * setAuth: Stores authenticated user profile in memory only (Zustand state).
   * NO token is stored. NO localStorage is written.
   * The HttpOnly cookie set by the backend carries authentication automatically.
   */
  setAuth: (rawUser) => {
    const roles = normalizeRoles(rawUser?.roles);
    const user = { ...rawUser, roles };
    set({ user, isAuthenticated: true, isInitializing: false });
  },

  /**
   * clearSession: Resets in-memory auth state.
   * No localStorage access — no JWT is stored there any more.
   */
  clearSession: () => {
    set({ user: null, isAuthenticated: false, isInitializing: false });
  },

  /**
   * logout: Clears in-memory state and navigates to root.
   * Cookie cleanup is handled server-side by POST /auth/logout (called by the logout UI action).
   * No localStorage access — no JWT is stored there any more.
   */
  logout: () => {
    if (typeof window !== 'undefined') {
      set({ user: null, isAuthenticated: false, isInitializing: false });
      window.location.href = '/';
    }
  },

  /**
   * initializeSession: Called once on app mount by AppProvider.
   *
   * Security: Authentication state is determined ONLY by asking the backend.
   * The browser automatically sends the HttpOnly access_token cookie to GET /auth/me.
   * No token is ever read from localStorage, sessionStorage, or any JS-readable storage.
   *
   * Flow:
   *   browser sends HttpOnly cookie → backend validates JWT → returns safe user profile
   *   → set isAuthenticated: true with the returned user profile
   *
   * If cookie is absent, expired, or invalid → backend returns 401 → isAuthenticated: false.
   */
  initializeSession: () => {
    if (typeof window === 'undefined') {
      set({ isInitializing: false });
      return;
    }

    // Resolve API base using the same logic as api-client.ts
    const apiBase = (() => {
      const defaultProdUrl = 'https://anveshak-erp.onrender.com/api/v1';
      let rawEnv = process.env.NEXT_PUBLIC_API_URL;
      if (!window.location.hostname.includes('localhost')) {
        if (!rawEnv || rawEnv.startsWith('/') || rawEnv.includes('localhost')) {
          rawEnv = defaultProdUrl;
        }
      }
      let base = (rawEnv || '/api/v1').replace(/\/+$/, '');
      if (!window.location.hostname.includes('localhost') && base.startsWith('http://')) {
        base = base.replace('http://', 'https://');
      }
      if (base.startsWith('http') && !base.includes('/api/v1')) {
        base = `${base}/api/v1`;
      }
      return base;
    })();

    fetch(`${apiBase}/auth/me`, {
      method: 'GET',
      // credentials: 'include' causes the browser to send the HttpOnly access_token cookie
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          // /auth/me returns { success: true, data: { id, email, roles, permissions, ... } }
          const rawUser = data?.data || data?.user || null;
          if (rawUser && rawUser.id) {
            const roles = normalizeRoles(rawUser.roles);
            const user: UserProfile = { ...rawUser, roles };
            set({ user, isAuthenticated: true, isInitializing: false });
            return;
          }
        }
        // 401 Unauthorized or malformed response — HttpOnly cookie is absent/invalid
        set({ user: null, isAuthenticated: false, isInitializing: false });
      })
      .catch(() => {
        // Network failure during startup: treat as unauthenticated
        set({ user: null, isAuthenticated: false, isInitializing: false });
      });
  },
}));
