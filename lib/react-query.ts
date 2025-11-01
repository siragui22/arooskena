/**
 * ⚡ Configuration React Query
 * Cache intelligent et gestion optimisée des requêtes
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache configuration
      staleTime: 5 * 60 * 1000, // 5 minutes - données considérées fraîches
      gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection (anciennement cacheTime)
      
      // Retry configuration
      retry: 1, // 1 seule tentative en cas d'échec
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch configuration
      refetchOnWindowFocus: false, // Ne pas refetch au focus (économise les requêtes)
      refetchOnReconnect: true, // Refetch si reconnexion internet
      refetchOnMount: false, // Ne pas refetch si données en cache
    },
    mutations: {
      // Retry mutations une fois seulement
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Query keys centralisés pour éviter les duplications
export const queryKeys = {
  // Auth
  auth: {
    user: ['auth', 'user'] as const,
    session: ['auth', 'session'] as const,
  },
  
  // Wedding
  wedding: {
    all: ['wedding'] as const,
    detail: (userId: string) => ['wedding', 'detail', userId] as const,
    categories: (weddingId: string) => ['wedding', 'categories', weddingId] as const,
    tasks: (weddingId: string) => ['wedding', 'tasks', weddingId] as const,
    expenses: (weddingId: string) => ['wedding', 'expenses', weddingId] as const,
    inspirations: (weddingId: string) => ['wedding', 'inspirations', weddingId] as const,
    timeline: (weddingId: string) => ['wedding', 'timeline', weddingId] as const,
  },
  
  // Prestataires
  prestataires: {
    all: ['prestataires'] as const,
    list: (filters?: any) => ['prestataires', 'list', filters] as const,
    detail: (id: string) => ['prestataires', 'detail', id] as const,
  },
  
  // Lieux de réception
  lieuxReception: {
    all: ['lieux-reception'] as const,
    list: (filters?: any) => ['lieux-reception', 'list', filters] as const,
    detail: (id: string) => ['lieux-reception', 'detail', id] as const,
  },
  
  // Blog
  blog: {
    all: ['blog'] as const,
    list: (filters?: any) => ['blog', 'list', filters] as const,
    detail: (slug: string) => ['blog', 'detail', slug] as const,
  },
  
  // Admin
  admin: {
    users: ['admin', 'users'] as const,
    stats: ['admin', 'stats'] as const,
    prestataires: ['admin', 'prestataires'] as const,
  },
};
