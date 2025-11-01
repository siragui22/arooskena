/**
 * 🔐 Store Zustand pour l'authentification
 * Centralise les données utilisateur pour éviter les duplications
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Profile {
  first_name?: string;
  last_name?: string;
  avatar?: string;
  slug?: string;
}

interface Role {
  name: string;
  label: string;
}

interface User {
  id: string;
  email: string;
  phone?: string;
  auth_user_id: string;
  role_id?: string;
  is_active: boolean;
  profiles?: Profile | Profile[];
  roles?: Role;
}

interface AuthState {
  user: User | null;
  authUserId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthUserId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      authUserId: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false 
      }),

      setAuthUserId: (id) => set({ authUserId: id }),

      setLoading: (loading) => set({ isLoading: loading }),

      clear: () => set({ 
        user: null, 
        authUserId: null, 
        isAuthenticated: false,
        isLoading: false 
      }),
    }),
    {
      name: 'arooskena-auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        authUserId: state.authUserId,
      }),
    }
  )
);
