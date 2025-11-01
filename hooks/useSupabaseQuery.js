'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook personnalisé pour optimiser les requêtes Supabase
 * @param {string} table - Nom de la table
 * @param {string} select - Colonnes à sélectionner
 * @param {Object} filters - Filtres à appliquer
 * @param {Object} options - Options supplémentaires
 */
export const useSupabaseQuery = (table, select = '*', filters = {}, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    enabled = true,
    single = false,
    orderBy = null,
    limit = null,
    dependencies = []
  } = options;

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase.from(table).select(select);

      // Appliquer les filtres
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Appliquer l'ordre
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      // Appliquer la limite
      if (limit) {
        query = query.limit(limit);
      }

      // Exécuter la requête
      const { data: result, error: queryError } = single 
        ? await query.single()
        : await query;

      if (queryError) {
        throw queryError;
      }

      setData(result);
    } catch (err) {
      console.error(`Erreur requête ${table}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [table, select, JSON.stringify(filters), single, orderBy, limit, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch
  };
};

/**
 * Hook pour les mutations Supabase (insert, update, delete)
 */
export const useSupabaseMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (operation) => {
    try {
      setLoading(true);
      setError(null);

      const result = await operation();
      return result;
    } catch (err) {
      console.error('Erreur mutation:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    mutate,
    loading,
    error
  };
};

export default useSupabaseQuery;
