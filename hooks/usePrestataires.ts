/**
 * 🏢 Hook React Query pour les Prestataires
 * Gestion de la liste et détails des prestataires
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { queryKeys } from '@/lib/react-query';
import { usePrestatairesStore } from '@/stores/usePrestatairesStore';

// ============================================
// 📥 QUERIES
// ============================================

/**
 * Hook pour récupérer la liste des prestataires avec filtres
 */
export function usePrestataires(filters?: {
  category?: string;
  subcategory?: string;
  city?: string;
  verified?: boolean;
}) {
  const { prestataires, setPrestataires } = usePrestatairesStore();

  return useQuery({
    queryKey: queryKeys.prestataires.list(filters),
    queryFn: async () => {
      console.log('🔄 Fetching prestataires...');

      let query = supabase
        .from('prestataires')
        .select(`
          *,
          categories(id, name, label),
          subcategories(id, name, label)
        `)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (filters?.category) {
        query = query.eq('category_id', filters.category);
      }
      if (filters?.subcategory) {
        query = query.eq('subcategory_id', filters.subcategory);
      }
      if (filters?.city) {
        query = query.eq('city', filters.city);
      }
      if (filters?.verified) {
        query = query.eq('is_verified', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Mettre en cache dans Zustand
      if (!filters || Object.keys(filters).length === 0) {
        setPrestataires(data || []);
      }

      console.log('✅ Prestataires cached');
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes pour les prestataires
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Hook pour récupérer le détail d'un prestataire
 */
export function usePrestataireDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.prestataires.detail(id),
    queryFn: async () => {
      console.log(`🔄 Fetching prestataire ${id}...`);

      const { data, error } = await supabase
        .from('prestataires')
        .select(`
          *,
          categories(id, name, label),
          subcategories(id, name, label),
          subscription_types(id, name, price, duration)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      console.log('✅ Prestataire detail cached');
      return data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes pour un détail
    enabled: !!id, // Ne fetch que si id existe
  });
}

/**
 * Hook pour récupérer les catégories de prestataires
 */
export function usePrestataireCategories() {
  return useQuery({
    queryKey: ['prestataire-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 heure (change rarement)
  });
}
