import { create } from 'zustand';

export interface UserProfile {
  id: string;
  email: string;
  status: string;
  roles: string[];
  permissions: string[];
  organization?: any;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserProfile, token?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setAuth: (user, token) => {
    const currentToken = token ?? get().token ?? '';
    set({ user, token: currentToken, isAuthenticated: true });
  },
  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
