/**
 * 👔 Hook React Query pour l'espace Admin
 * Gestion des stats, users, prestataires pour l'admin
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { queryKeys } from '@/lib/react-query';

// ============================================
// 📊 QUERIES - Stats Admin
// ============================================

/**
 * Hook pour récupérer toutes les stats admin
 */
export function useAdminStats(enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.stats,
    enabled: enabled, // Ne s'exécute que si enabled = true
    queryFn: async () => {
      console.log('🔄 Fetching admin stats...');

      const [usersCount, prestatairesCount, mariagesCount, lieuxCount, carouselCount, articlesCount] = 
        await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('prestataires').select('*', { count: 'exact', head: true }),
          supabase.from('weddings').select('*', { count: 'exact', head: true }),
          supabase.from('lieux_reception').select('*', { count: 'exact', head: true }),
          supabase.from('carousel_items').select('*', { count: 'exact', head: true }),
          supabase.from('articles').select('*', { count: 'exact', head: true })
        ]);

      const stats = {
        totalUsers: usersCount.count || 0,
        totalPrestataires: prestatairesCount.count || 0,
        totalMariages: mariagesCount.count || 0,
        totalLieuxReception: lieuxCount.count || 0,
        totalCarouselItems: carouselCount.count || 0,
        totalArticles: articlesCount.count || 0,
      };

      console.log('✅ Admin stats cached');
      return stats;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes pour les stats
    gcTime: 5 * 60 * 1000,
  });
}

// ============================================
// 👥 QUERIES - Users Admin
// ============================================

/**
 * Hook pour récupérer tous les users (admin)
 */
export function useAdminUsers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.users,
    enabled: enabled,
    queryFn: async () => {
      console.log('🔄 Fetching admin users...');

      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          roles(name, label),
          profiles(first_name, last_name, avatar)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ Admin users cached');
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================
// 🏢 QUERIES - Prestataires Admin
// ============================================

/**
 * Hook pour récupérer tous les prestataires (admin)
 */
export function useAdminPrestataires(enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.prestataires,
    enabled: enabled,
    queryFn: async () => {
      console.log('🔄 Fetching admin prestataires...');

      const { data, error } = await supabase
        .from('prestataires')
        .select(`
          *,
          categories(name, label),
          subcategories(name, label),
          subscription_types(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ Admin prestataires cached');
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================
// 📤 MUTATIONS - User Management
// ============================================

/**
 * Mutation pour changer le statut d'un user
 */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('users')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) throw error;
      return { userId, isActive };
    },
    onSuccess: () => {
      // Invalider le cache des users
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
}

/**
 * Mutation pour actions bulk sur users
 */
export function useBulkUpdateUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userIds, isActive }: { userIds: string[]; isActive: boolean }) => {
      const updates = userIds.map(userId =>
        supabase
          .from('users')
          .update({ is_active: isActive })
          .eq('id', userId)
      );

      await Promise.all(updates);
      return { userIds, isActive };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
}

// ============================================
// 🏢 MUTATIONS - Prestataire Verification
// ============================================

/**
 * Mutation pour vérifier un prestataire
 */
export function useVerifyPrestataire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ prestataireId, isVerified }: { prestataireId: string; isVerified: boolean }) => {
      const { error } = await supabase
        .from('prestataires')
        .update({ is_verified: isVerified })
        .eq('id', prestataireId);

      if (error) throw error;
      return { prestataireId, isVerified };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.prestataires });
    },
  });
}
