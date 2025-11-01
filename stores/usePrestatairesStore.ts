/**
 * 👔 Store Zustand pour les prestataires
 * Cache les listes de prestataires et lieux de réception
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Prestataire {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
  subcategory_id?: string;
  is_verified?: boolean;
  is_featured?: boolean;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  main_image?: string;
  price_range?: string;
}

interface LieuReception {
  id: string;
  name: string;
  description?: string;
  category?: string;
  capacity_min?: number;
  capacity_max?: number;
  price_range?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  main_image?: string;
}

interface PrestatairesState {
  // Data
  prestataires: Prestataire[];
  lieuxReception: LieuReception[];
  
  // Filters
  selectedCategory: string | null;
  searchTerm: string;
  
  // Cache
  lastFetchedAt: number | null;
  cacheValid: boolean;
  
  // Actions
  setPrestataires: (prestataires: Prestataire[]) => void;
  setLieuxReception: (lieux: LieuReception[]) => void;
  setSelectedCategory: (category: string | null) => void;
  setSearchTerm: (term: string) => void;
  
  invalidateCache: () => void;
  clear: () => void;
}

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes pour les prestataires

export const usePrestatairesStore = create<PrestatairesState>()(
  persist(
    (set) => ({
      // Initial state
      prestataires: [],
      lieuxReception: [],
      selectedCategory: null,
      searchTerm: '',
      lastFetchedAt: null,
      cacheValid: false,

      // Setters
      setPrestataires: (prestataires) => set({ 
        prestataires,
        lastFetchedAt: Date.now(),
        cacheValid: true 
      }),

      setLieuxReception: (lieux) => set({ 
        lieuxReception: lieux,
        lastFetchedAt: Date.now(),
        cacheValid: true 
      }),

      setSelectedCategory: (category) => set({ selectedCategory: category }),
      setSearchTerm: (term) => set({ searchTerm: term }),

      // Cache management
      invalidateCache: () => set({ cacheValid: false }),

      clear: () => set({
        prestataires: [],
        lieuxReception: [],
        selectedCategory: null,
        searchTerm: '',
        lastFetchedAt: null,
        cacheValid: false,
      }),
    }),
    {
      name: 'arooskena-prestataires-storage',
      partialize: (state) => ({
        prestataires: state.prestataires,
        lieuxReception: state.lieuxReception,
        lastFetchedAt: state.lastFetchedAt,
        cacheValid: state.cacheValid,
      }),
    }
  )
);
