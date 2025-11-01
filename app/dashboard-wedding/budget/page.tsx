'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWeddingData, useAddExpense, useDeleteExpense } from '@/hooks/useWedding';
import { 
  DollarSign, ArrowLeft, Plus, Edit2, Trash2, 
  TrendingUp, TrendingDown, AlertCircle, Cake, 
  Flower2, Camera, Music, Car, Home, Gift, Sparkles,
  PieChart, BarChart3, Check, X
} from 'lucide-react';

export default function BudgetPage() {
  const router = useRouter();
  
  // ✅ Hooks React Query optimisés - Cache automatique, 0 duplications
  const { wedding, budgetCategories, expenses, isLoading } = useWeddingData();
  const addExpenseMutation = useAddExpense();
  const deleteExpenseMutation = useDeleteExpense();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    name: '',
    estimated_amount: '',
    actual_amount: '',
    payment_status: 'non_paye',
    notes: ''
  });

  const categoryIcons = {
    'Cake': Cake,
    'Flower2': Flower2,
    'Camera': Camera,
    'Music': Music,
    'Car': Car,
    'Home': Home,
    'Gift': Gift,
    'Sparkles': Sparkles
  };

  // ✅ Plus besoin de useEffect ni de fetchBudgetData!
  // Les données sont automatiquement fetchées et cachées par React Query

  const handleAddExpense = async (e) => {
    e.preventDefault();

    try {
      // ✅ Mutation avec optimistic update - L'UI se met à jour immédiatement!
      await addExpenseMutation.mutateAsync({
        wedding_id: wedding.id,
        budget_category_id: selectedCategory,
        name: expenseForm.name,
        estimated_amount: expenseForm.estimated_amount ? parseFloat(expenseForm.estimated_amount) : null,
        actual_amount: expenseForm.actual_amount ? parseFloat(expenseForm.actual_amount) : null,
        payment_status: expenseForm.payment_status,
        notes: expenseForm.notes
      });

      // ✅ Succès - Reset le formulaire
      setShowAddExpense(false);
      setExpenseForm({
        name: '',
        estimated_amount: '',
        actual_amount: '',
        payment_status: 'non_paye',
        notes: ''
      });
    } catch (error) {
      alert('Erreur lors de l\'ajout de la dépense');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;

    try {
      // ✅ Mutation avec optimistic update - Suppression instantanée dans l'UI!
      await deleteExpenseMutation.mutateAsync(expenseId);
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Aucun mariage trouvé</p>
          <button
            onClick={() => router.push('/dashboard-wedding/new')}
            className="px-6 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white font-semibold rounded-full"
          >
            Créer un mariage
          </button>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalBudget = wedding.max_budget || 0;
  const totalEstimated = budgetCategories.reduce((sum, cat) => sum + (cat.allocated_budget || 0), 0);
  const totalSpent = expenses.reduce((sum, exp) => sum + (exp.actual_amount || 0), 0);
  const totalRemaining = totalBudget - totalSpent;
  const budgetPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="min-h-screen bg-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard-wedding')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Retour au dashboard</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Budget du mariage
              </h1>
              <p className="text-gray-600">{wedding.title}</p>
            </div>
            <div className="flex gap-2">
              <button className="p-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all">
                <PieChart className="text-gray-600" size={20} />
              </button>
              <button className="p-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all">
                <BarChart3 className="text-gray-600" size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Budget Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Budget Total</h3>
              <DollarSign className="text-blue-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalBudget.toLocaleString()} DJF</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Dépensé</h3>
              <TrendingUp className="text-red-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalSpent.toLocaleString()} DJF</p>
            <p className="text-xs text-gray-500 mt-1">{budgetPercentage.toFixed(1)}% du total</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Restant</h3>
              <TrendingDown className="text-green-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalRemaining.toLocaleString()} DJF</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div 
                className="bg-gradient-to-r from-pink-400 to-orange-300 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className={`rounded-2xl shadow-sm p-6 border ${
            budgetPercentage > 100 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Statut</h3>
              <AlertCircle className={budgetPercentage > 100 ? 'text-red-500' : 'text-green-500'} size={20} />
            </div>
            <p className={`text-2xl font-bold ${budgetPercentage > 100 ? 'text-red-600' : 'text-green-600'}`}>
              {budgetPercentage > 100 ? 'Dépassé' : 'OK'}
            </p>
          </div>
        </div>

        {/* Categories List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Catégories de dépenses</h2>

          {budgetCategories.map((category) => {
            const categoryExpenses = expenses.filter(e => e.budget_category_id === category.id);
            const categorySpent = categoryExpenses.reduce((sum, e) => sum + (e.actual_amount || 0), 0);
            const IconComponent = categoryIcons[category.icon] || Sparkles;

            return (
              <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-all"
                  onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <IconComponent size={24} style={{ color: category.color }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{category.label}</h3>
                        <p className="text-sm text-gray-600">
                          {categoryExpenses.length} dépense(s)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {categorySpent.toLocaleString()} DJF
                      </p>
                      {category.allocated_budget && (
                        <p className="text-sm text-gray-500">
                          / {category.allocated_budget.toLocaleString()} DJF alloués
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Category Details */}
                {selectedCategory === category.id && (
                  <div className="border-t border-gray-100 p-6 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Dépenses</h4>
                      <button
                        onClick={() => setShowAddExpense(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-400 to-orange-300 text-white text-sm font-medium rounded-full hover:shadow-lg transition-all"
                      >
                        <Plus size={16} />
                        Ajouter une dépense
                      </button>
                    </div>

                    {categoryExpenses.length > 0 ? (
                      <div className="space-y-3">
                        {categoryExpenses.map((expense) => (
                          <div key={expense.id} className="bg-white rounded-xl p-4 border border-gray-100">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900 mb-1">{expense.name}</h5>
                                {expense.notes && (
                                  <p className="text-sm text-gray-600 mb-2">{expense.notes}</p>
                                )}
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-gray-600">
                                    Estimé: <span className="font-semibold">{(expense.estimated_amount || 0).toLocaleString()} DJF</span>
                                  </span>
                                  <span className="text-gray-900">
                                    Réel: <span className="font-bold">{(expense.actual_amount || 0).toLocaleString()} DJF</span>
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    expense.payment_status === 'complet' ? 'bg-green-100 text-green-700' :
                                    expense.payment_status === 'acompte' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {expense.payment_status === 'complet' ? 'Payé' :
                                     expense.payment_status === 'acompte' ? 'Acompte' :
                                     expense.payment_status === 'solde' ? 'Solde' : 'Non payé'}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>Aucune dépense dans cette catégorie</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Ajouter une dépense</h3>
              <button
                onClick={() => setShowAddExpense(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Nom de la dépense *
                </label>
                <input
                  type="text"
                  value={expenseForm.name}
                  onChange={(e) => setExpenseForm({...expenseForm, name: e.target.value})}
                  placeholder="ex: Location salle Palm Hotel"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Montant estimé (DJF)
                  </label>
                  <input
                    type="number"
                    value={expenseForm.estimated_amount}
                    onChange={(e) => setExpenseForm({...expenseForm, estimated_amount: e.target.value})}
                    placeholder="5000"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Montant réel (DJF)
                  </label>
                  <input
                    type="number"
                    value={expenseForm.actual_amount}
                    onChange={(e) => setExpenseForm({...expenseForm, actual_amount: e.target.value})}
                    placeholder="4500"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Statut de paiement
                </label>
                <select
                  value={expenseForm.payment_status}
                  onChange={(e) => setExpenseForm({...expenseForm, payment_status: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                >
                  <option value="non_paye">Non payé</option>
                  <option value="acompte">Acompte versé</option>
                  <option value="solde">Solde versé</option>
                  <option value="complet">Payé complet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Notes
                </label>
                <textarea
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
                  placeholder="Détails additionnels..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-full hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white font-semibold rounded-full hover:shadow-lg transition-all"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
