/**
 * 💒 Store Zustand pour les données du mariage
 * Cache les données du mariage pour éviter les refetch constants
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Wedding {
  id: string;
  user_id: string;
  title: string;
  wedding_date: string;
  estimated_guests: number;
  max_budget?: number;
  status: string;
  subscription_type_id?: string;
  wedding_subscription_types?: any;
  created_at?: string;
  updated_at?: string;
}

interface BudgetCategory {
  id: string;
  wedding_id: string;
  name: string;
  label: string;
  allocated_budget?: number;
  icon?: string;
  color?: string;
  display_order: number;
}

interface Task {
  id: string;
  wedding_id: string;
  title: string;
  description?: string;
  status: 'a_faire' | 'en_cours' | 'termine';
  priority: 'basse' | 'moyenne' | 'haute' | 'critique';
  due_date?: string;
  assigned_to?: string;
  category?: string;
}

interface Expense {
  id: string;
  wedding_id: string;
  budget_category_id: string;
  name: string;
  estimated_amount?: number;
  actual_amount?: number;
  payment_status: 'non_paye' | 'acompte' | 'solde' | 'complet';
  notes?: string;
}

interface WeddingState {
  // Data
  wedding: Wedding | null;
  budgetCategories: BudgetCategory[];
  tasks: Task[];
  expenses: Expense[];
  
  // Cache metadata
  lastFetchedAt: number | null;
  cacheValid: boolean;
  
  // Actions
  setWedding: (wedding: Wedding | null) => void;
  setBudgetCategories: (categories: BudgetCategory[]) => void;
  setTasks: (tasks: Task[]) => void;
  setExpenses: (expenses: Expense[]) => void;
  
  // Optimistic updates
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  
  addExpense: (expense: Expense) => void;
  updateExpense: (expenseId: string, updates: Partial<Expense>) => void;
  deleteExpense: (expenseId: string) => void;
  
  // Cache management
  invalidateCache: () => void;
  clear: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useWeddingStore = create<WeddingState>()(
  persist(
    (set, get) => ({
      // Initial state
      wedding: null,
      budgetCategories: [],
      tasks: [],
      expenses: [],
      lastFetchedAt: null,
      cacheValid: false,

      // Setters
      setWedding: (wedding) => set({ 
        wedding, 
        lastFetchedAt: Date.now(),
        cacheValid: true 
      }),

      setBudgetCategories: (categories) => set({ 
        budgetCategories: categories,
        lastFetchedAt: Date.now(),
        cacheValid: true 
      }),

      setTasks: (tasks) => set({ 
        tasks,
        lastFetchedAt: Date.now(),
        cacheValid: true 
      }),

      setExpenses: (expenses) => set({ 
        expenses,
        lastFetchedAt: Date.now(),
        cacheValid: true 
      }),

      // Optimistic updates - Tasks
      addTask: (task) => set((state) => ({
        tasks: [...state.tasks, task]
      })),

      updateTask: (taskId, updates) => set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        )
      })),

      deleteTask: (taskId) => set((state) => ({
        tasks: state.tasks.filter(task => task.id !== taskId)
      })),

      // Optimistic updates - Expenses
      addExpense: (expense) => set((state) => ({
        expenses: [...state.expenses, expense]
      })),

      updateExpense: (expenseId, updates) => set((state) => ({
        expenses: state.expenses.map(expense => 
          expense.id === expenseId ? { ...expense, ...updates } : expense
        )
      })),

      deleteExpense: (expenseId) => set((state) => ({
        expenses: state.expenses.filter(expense => expense.id !== expenseId)
      })),

      // Cache management
      invalidateCache: () => set({ cacheValid: false }),

      clear: () => set({
        wedding: null,
        budgetCategories: [],
        tasks: [],
        expenses: [],
        lastFetchedAt: null,
        cacheValid: false,
      }),
    }),
    {
      name: 'arooskena-wedding-storage',
      partialize: (state) => ({
        wedding: state.wedding,
        budgetCategories: state.budgetCategories,
        tasks: state.tasks,
        expenses: state.expenses,
        lastFetchedAt: state.lastFetchedAt,
        cacheValid: state.cacheValid,
      }),
    }
  )
);

// Helper pour vérifier si le cache est encore valide
export const isCacheValid = () => {
  const { lastFetchedAt, cacheValid } = useWeddingStore.getState();
  if (!cacheValid || !lastFetchedAt) return false;
  return Date.now() - lastFetchedAt < CACHE_DURATION;
};
