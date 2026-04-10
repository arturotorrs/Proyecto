import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (data: { user: User; accessToken: string; refreshToken: string }) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
}

function loadFromStorage() {
  try {
    return {
      user: JSON.parse(localStorage.getItem('imss_user') || 'null'),
      accessToken: localStorage.getItem('imss_access_token'),
      refreshToken: localStorage.getItem('imss_refresh_token'),
    };
  } catch {
    return { user: null, accessToken: null, refreshToken: null };
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  ...loadFromStorage(),

  login({ user, accessToken, refreshToken }) {
    localStorage.setItem('imss_user', JSON.stringify(user));
    localStorage.setItem('imss_access_token', accessToken);
    localStorage.setItem('imss_refresh_token', refreshToken);
    set({ user, accessToken, refreshToken });
  },

  logout() {
    localStorage.removeItem('imss_user');
    localStorage.removeItem('imss_access_token');
    localStorage.removeItem('imss_refresh_token');
    set({ user: null, accessToken: null, refreshToken: null });
  },

  setAccessToken(token) {
    localStorage.setItem('imss_access_token', token);
    set({ accessToken: token });
  },
}));
