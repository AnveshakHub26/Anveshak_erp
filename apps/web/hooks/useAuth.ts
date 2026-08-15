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

const getInitialState = () => {
  return { user: null, token: null, isAuthenticated: false, isInitializing: true };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...getInitialState(),
  setAuth: (user, token) => {
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
        set({ user: parsedUser, token: storedToken, isAuthenticated: true, isInitializing: false });
      } else {
        set({ user: null, token: null, isAuthenticated: false, isInitializing: false });
      }
    } catch {
      set({ user: null, token: null, isAuthenticated: false, isInitializing: false });
    }
  },
}));
