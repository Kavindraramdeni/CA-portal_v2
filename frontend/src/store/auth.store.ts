import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  
  setAuth: (user: User, token: string, refreshToken?: string, expiresIn?: number) => void;
  logout: () => void;
  updateUser: (u: Partial<User>) => void;
  isTokenExpired: () => boolean;
  isTokenExpiringSoon: (minBefore?: number) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,

      setAuth: (user, token, refreshToken = '', expiresIn = 3600) => {
        set({
          user,
          token,
          refreshToken: refreshToken || null,
          expiresAt: Date.now() + expiresIn * 1000, // Convert to milliseconds
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          expiresAt: null,
          isAuthenticated: false,
        });
      },

      updateUser: (u) => {
        set((s) => ({
          user: s.user ? { ...s.user, ...u } : null,
        }));
      },

      // ✅ Check if token is completely expired
      isTokenExpired: () => {
        const state = get();
        if (!state.expiresAt) return false;
        return Date.now() > state.expiresAt;
      },

      // ✅ Check if token expires within X milliseconds (default 5 minutes)
      isTokenExpiringSoon: (minBefore = 5 * 60 * 1000) => {
        const state = get();
        if (!state.expiresAt) return false;
        return Date.now() > state.expiresAt - minBefore;
      },
    }),
    {
      name: 'ca-portal-auth',
      // Only persist these keys
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
