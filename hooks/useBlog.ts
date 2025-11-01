/**
 * 📝 Hook React Query pour le Blog
 * Gestion des articles et tags
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { queryKeys } from '@/lib/react-query';

// ============================================
// 📥 QUERIES
// ============================================

/**
 * Hook pour récupérer la liste des articles avec pagination
 */
export function useBlogArticles(filters?: {
  category?: string;
  tag?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters?.page || 1;
  const limit = filters?.limit || 7;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return useQuery({
    queryKey: queryKeys.blog.list(filters),
    queryFn: async () => {
      console.log('🔄 Fetching blog articles...');

      let query = supabase
        .from('articles')
        .select('*, article_tags(tags(*))', { count: 'exact' })
        .eq('published', true)
        .order('published_at', { ascending: false })
        .range(from, to);

      // Appliquer les filtres
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      console.log('✅ Blog articles cached');
      return {
        articles: data || [],
        totalCount: count || 0,
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes pour le blog
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Hook pour récupérer un article par son slug
 */
export function useBlogArticle(slug: string) {
  return useQuery({
    queryKey: queryKeys.blog.detail(slug),
    queryFn: async () => {
      console.log(`🔄 Fetching article ${slug}...`);

      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          article_tags(tags(*))
        `)
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (error) throw error;

      console.log('✅ Article cached');
      return data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes pour un article
    enabled: !!slug,
  });
}

/**
 * Hook pour récupérer tous les tags
 */
export function useBlogTags() {
  return useQuery({
    queryKey: ['blog-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 heure (change rarement)
  });
}

/**
 * Hook pour récupérer les catégories du blog
 */
export function useBlogCategories() {
  return useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      // Si vous avez une table categories pour le blog
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      if (error) {
        // Fallback: extraire les catégories uniques des articles
        const { data: articles } = await supabase
          .from('articles')
          .select('category')
          .eq('published', true);

        const uniqueCategories = [...new Set(articles?.map(a => a.category).filter(Boolean))];
        return uniqueCategories.map(cat => ({ name: cat, label: cat }));
      }

      return data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 heure
  });
}
