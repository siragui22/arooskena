/**
 * 💒 Hook React Query pour les données du mariage
 * Remplace les appels directs Supabase et élimine les duplications
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { queryKeys } from '@/lib/react-query';
import { useWeddingStore, isCacheValid } from '@/stores/useWeddingStore';
import { useAuthStore } from '@/stores/useAuthStore';

// ============================================
// 📥 QUERIES (lecture de données)
// ============================================

/**
 * Hook principal pour récupérer les données complètes du mariage
 * Inclut: wedding, categories, tasks, expenses
 */
export function useWeddingData() {
  const user = useAuthStore((state) => state.user);
  const { 
    wedding, 
    budgetCategories, 
    tasks, 
    expenses,
    setWedding,
    setBudgetCategories,
    setTasks,
    setExpenses
  } = useWeddingStore();

  const query = useQuery({
    queryKey: queryKeys.wedding.detail(user?.id || ''),
    queryFn: async () => {
      // Vérifier d'abord le cache Zustand
      if (isCacheValid() && wedding) {
        console.log('📦 Cache Zustand hit - wedding data');
        return { wedding, budgetCategories, tasks, expenses };
      }

      console.log('🔄 Fetching wedding data from Supabase...');

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Fetch wedding
      const { data: weddingData, error: weddingError } = await supabase
        .from('weddings')
        .select('*, wedding_subscription_types(*)')
        .eq('user_id', user.id)
        .eq('status', 'planification')
        .single();

      if (weddingError) throw weddingError;
      if (!weddingData) return null;

      // Fetch tout en parallèle pour optimiser
      const [categoriesRes, tasksRes, expensesRes] = await Promise.all([
        supabase
          .from('wedding_budget_categories')
          .select('*')
          .eq('wedding_id', weddingData.id)
          .order('display_order'),
        
        supabase
          .from('wedding_tasks')
          .select('*')
          .eq('wedding_id', weddingData.id)
          .order('due_date'),
        
        supabase
          .from('wedding_expenses')
          .select('*')
          .eq('wedding_id', weddingData.id)
      ]);

      const result = {
        wedding: weddingData,
        budgetCategories: categoriesRes.data || [],
        tasks: tasksRes.data || [],
        expenses: expensesRes.data || [],
      };

      // Mettre à jour le store Zustand
      setWedding(result.wedding);
      setBudgetCategories(result.budgetCategories);
      setTasks(result.tasks);
      setExpenses(result.expenses);

      console.log('✅ Wedding data cached');

      return result;
    },
    enabled: !!user?.id, // Ne s'exécute que si user existe
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    wedding: query.data?.wedding || wedding,
    budgetCategories: query.data?.budgetCategories || budgetCategories,
    tasks: query.data?.tasks || tasks,
    expenses: query.data?.expenses || expenses,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook pour récupérer uniquement le wedding (plus léger)
 */
export function useWedding() {
  const user = useAuthStore((state) => state.user);
  const wedding = useWeddingStore((state) => state.wedding);
  const setWedding = useWeddingStore((state) => state.setWedding);

  const query = useQuery({
    queryKey: queryKeys.wedding.detail(user?.id || ''),
    queryFn: async () => {
      if (isCacheValid() && wedding) {
        console.log('📦 Cache hit - wedding');
        return wedding;
      }

      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('weddings')
        .select('*, wedding_subscription_types(*)')
        .eq('user_id', user.id)
        .eq('status', 'planification')
        .single();

      if (error) throw error;
      
      setWedding(data);
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    wedding: query.data || wedding,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

// ============================================
// 📤 MUTATIONS (modifications de données)
// ============================================

/**
 * Mutation pour ajouter une dépense
 */
export function useAddExpense() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const addExpense = useWeddingStore((state) => state.addExpense);

  return useMutation({
    mutationFn: async (expenseData: any) => {
      const { data, error } = await supabase
        .from('wedding_expenses')
        .insert([expenseData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newExpense) => {
      // Optimistic update - mise à jour immédiate de l'UI
      addExpense(newExpense);
    },
    onSuccess: () => {
      // Invalider le cache pour refetch les données
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.wedding.detail(user?.id || '') 
      });
    },
    onError: (error) => {
      console.error('❌ Error adding expense:', error);
      // En cas d'erreur, refetch pour sync l'UI
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.wedding.detail(user?.id || '') 
      });
    },
  });
}

/**
 * Mutation pour supprimer une dépense
 */
export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const deleteExpense = useWeddingStore((state) => state.deleteExpense);

  return useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from('wedding_expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;
      return expenseId;
    },
    onMutate: async (expenseId) => {
      // Optimistic update
      deleteExpense(expenseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.wedding.detail(user?.id || '') 
      });
    },
  });
}

/**
 * Mutation pour ajouter une tâche
 */
export function useAddTask() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const addTask = useWeddingStore((state) => state.addTask);

  return useMutation({
    mutationFn: async (taskData: any) => {
      const { data, error } = await supabase
        .from('wedding_tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newTask) => {
      addTask(newTask);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.wedding.detail(user?.id || '') 
      });
    },
  });
}

/**
 * Mutation pour mettre à jour une tâche
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const updateTask = useWeddingStore((state) => state.updateTask);

  return useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: any }) => {
      const { data, error } = await supabase
        .from('wedding_tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ taskId, updates }) => {
      updateTask(taskId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.wedding.detail(user?.id || '') 
      });
    },
  });
}

/**
 * Mutation pour supprimer une tâche
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const deleteTask = useWeddingStore((state) => state.deleteTask);

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('wedding_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return taskId;
    },
    onMutate: async (taskId) => {
      deleteTask(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.wedding.detail(user?.id || '') 
      });
    },
  });
}
