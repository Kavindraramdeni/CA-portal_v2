import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (u: Partial<User>) => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: false,

      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),

      logout: () =>
        set({ user: null, token: null, isAuthenticated: false }),

      updateUser: (u) =>
        set((s) => ({
          user: s.user ? { ...s.user, ...u } : null,
        })),

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'ca-portal-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
