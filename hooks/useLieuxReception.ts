/**
 * 🏛️ Hook React Query pour les Lieux de Réception
 * Gestion de la liste et détails des lieux
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
 * Hook pour récupérer la liste des lieux de réception avec filtres
 */
export function useLieuxReception(filters?: {
  category?: string;
  city?: string;
  capacity_min?: number;
  capacity_max?: number;
  price_range?: string;
}) {
  const { lieuxReception, setLieuxReception } = usePrestatairesStore();

  return useQuery({
    queryKey: queryKeys.lieuxReception.list(filters),
    queryFn: async () => {
      console.log('🔄 Fetching lieux reception...');

      let query = supabase
        .from('lieux_reception')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.city) {
        query = query.eq('city', filters.city);
      }
      if (filters?.capacity_min) {
        query = query.gte('capacity_max', filters.capacity_min);
      }
      if (filters?.capacity_max) {
        query = query.lte('capacity_min', filters.capacity_max);
      }
      if (filters?.price_range) {
        query = query.eq('price_range', filters.price_range);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Mettre en cache dans Zustand
      if (!filters || Object.keys(filters).length === 0) {
        setLieuxReception(data || []);
      }

      console.log('✅ Lieux reception cached');
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Hook pour récupérer le détail d'un lieu de réception
 */
export function useLieuReceptionDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.lieuxReception.detail(id),
    queryFn: async () => {
      console.log(`🔄 Fetching lieu reception ${id}...`);

      const { data, error } = await supabase
        .from('lieux_reception')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      console.log('✅ Lieu reception detail cached');
      return data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!id,
  });
}
