'use client';

import { useWeddingData } from '@/hooks/useWedding';
import { useAuthStore } from '@/stores/useAuthStore';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Calendar, Heart, MapPin, Edit, User, DollarSign, 
  CheckCircle, Clock, Sparkles, Camera, Music, 
  Cake, Car, Users, Flower2, Home, Gift, 
  TrendingUp, AlertCircle, ChevronRight, Phone
} from 'lucide-react';

export default function DashboardWeddingPage() {
  // ✅ Hook React Query optimisé - Fetch une seule fois, cache automatique
  const { 
    wedding, 
    budgetCategories, 
    tasks, 
    expenses,
    isLoading 
  } = useWeddingData();

  // ✅ User depuis le store global Zustand - Pas de fetch supplémentaire
  const user = useAuthStore((state) => state.user);

  // Normaliser les profils (peut être un array ou un objet)
  const userProfile = user?.profiles ? 
    (Array.isArray(user.profiles) ? user.profiles[0] : user.profiles) 
    : null;

  // Calcul des jours restants
  const daysUntilWedding = wedding ? (() => {
    const today = new Date();
    const weddingDate = new Date(wedding.wedding_date);
    const diffTime = weddingDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  })() : 0;

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
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-lg">
          <Heart className="w-16 h-16 text-pink-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Créez votre premier mariage</h2>
          <p className="text-gray-600 mb-6">Commencez à planifier le mariage de vos rêves avec Arooskena</p>
          <Link 
            href="/dashboard-wedding/new"
            className="inline-block px-6 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white font-semibold rounded-full hover:shadow-lg transition-all"
          >
            Créer mon mariage
          </Link>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'termine').length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalBudget = wedding.max_budget || 0;
  const estimatedBudget = budgetCategories.reduce((sum, cat) => sum + (cat.allocated_budget || 0), 0);
  const actualSpent = expenses.reduce((sum, exp) => sum + (exp.actual_amount || 0), 0);
  const budgetUsedPercentage = totalBudget > 0 ? Math.round((actualSpent / totalBudget) * 100) : 0;

  const categoryIcons = {
    'Restauration': Cake,
    'Décoration': Flower2,
    'Photographie': Camera,
    'Musique': Music,
    'Transport': Car,
    'Faveurs': Gift,
    'Lieu': Home,
    'Autre': Sparkles
  };

  return (
    <div className="min-h-screen bg-pink-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-gray-200 min-h-screen p-6 sticky top-0 hidden lg:block">
          {/* Profile Section */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-pink-400 to-orange-300 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
              {userProfile?.avatar ? (
                <img
                  src={userProfile.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
            </div>
            <h3 className="font-bold text-gray-900 text-lg">
              {userProfile?.first_name} {userProfile?.last_name}
            </h3>
            <p className="text-sm text-gray-500">{user?.email}</p>
            {user?.phone && (
              <div className="flex items-center justify-center gap-1 text-sm text-gray-500 mt-2">
                <Phone size={14} />
                <span>{user.phone}</span>
              </div>
            )}
          </div>

          <Link href="/dashboard-wedding/profile">
            <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all mb-6 flex items-center justify-center gap-2">
              <Edit size={16} />
              Modifier le profil
            </button>
          </Link>

          {/* About */}
          <div className="mb-6">
            <h4 className="font-bold text-gray-900 mb-2">À propos</h4>
            <p className="text-sm text-gray-600">
              Bienvenue sur votre espace personnel pour organiser votre mariage de rêve !
            </p>
          </div>

          {/* Wedding Countdown Card */}
          <div className="mb-6 bg-gradient-to-br from-pink-400 to-orange-300 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <h3 className="font-bold text-xl mb-2">{wedding.title}</h3>
              <p className="text-sm opacity-90 mb-4">
                {new Date(wedding.wedding_date).toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{daysUntilWedding}</div>
                  <div className="text-xs opacity-90">Jours</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{wedding.estimated_guests || 0}</div>
                  <div className="text-xs opacity-90">Invités</div>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Categories */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-900">Catégories</h4>
              <Link href="/dashboard-wedding/budget" className="text-sm text-pink-500 hover:text-pink-600">
                Voir tout
              </Link>
            </div>
            <div className="space-y-2">
              {budgetCategories.slice(0, 5).map((category) => {
                const IconComponent = categoryIcons[category.name] || Sparkles;
                const categoryExpenses = expenses.filter(e => e.budget_category_id === category.id);
                const spent = categoryExpenses.reduce((sum, e) => sum + (e.actual_amount || 0), 0);
                
                return (
                  <div key={category.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-all cursor-pointer">
                    <div className="flex items-center gap-2">
                      <IconComponent size={16} className="text-gray-600" />
                      <span className="text-sm text-gray-700">{category.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {spent.toLocaleString()} DJF
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Hero Section */}
          <div className="relative h-48 bg-gradient-to-r from-pink-400 via-pink-300 to-orange-300">
            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
            <div className="absolute bottom-6 left-6 right-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{wedding.title}</h1>
                  <div className="flex items-center gap-4 text-white/90 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>Dans {daysUntilWedding} jours</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      <span>{wedding.estimated_guests} invités</span>
                    </div>
                  </div>
                </div>
                {/* <button className="px-6 py-3 bg-white text-pink-600 font-semibold rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                  <Sparkles size={18} />
                  Assistant IA
                </button> */}
              </div>
            </div>
          </div>

          <div className="p-6 max-w-7xl mx-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Progress Card */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Progression</h3>
                  <CheckCircle className="text-green-500" size={20} />
                </div>
                <div className="mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{progressPercentage}%</span>
                    <span className="text-sm text-gray-500">complété</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-gradient-to-r from-pink-400 to-orange-300 h-2 rounded-full transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">{completedTasks}/{totalTasks} tâches terminées</p>
              </div>

              {/* Budget Card */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Budget</h3>
                  <DollarSign className="text-blue-500" size={20} />
                </div>
                <div className="mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{budgetUsedPercentage}%</span>
                    <span className="text-sm text-gray-500">utilisé</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(budgetUsedPercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  {actualSpent.toLocaleString()} / {totalBudget.toLocaleString()} DJF
                </p>
              </div>

              {/* Countdown Card */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Compte à rebours</h3>
                  <Clock className="text-pink-500" size={20} />
                </div>
                <div className="mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{daysUntilWedding}</span>
                    <span className="text-sm text-gray-500">jours</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  jusqu'au {new Date(wedding.wedding_date).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Tâches à venir</h2>
                <Link 
                  href="/dashboard-wedding/tasks"
                  className="text-sm text-pink-500 hover:text-pink-600 font-medium flex items-center gap-1"
                >
                  Voir tout
                  <ChevronRight size={16} />
                </Link>
              </div>

              {tasks.filter(t => t.status !== 'termine').slice(0, 5).length > 0 ? (
                <div className="space-y-3">
                  {tasks.filter(t => t.status !== 'termine').slice(0, 5).map((task) => (
                    <div 
                      key={task.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          task.priority === 'critique' ? 'bg-red-500' :
                          task.priority === 'haute' ? 'bg-orange-500' :
                          task.priority === 'moyenne' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}></div>
                        <div>
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          {task.due_date && (
                            <p className="text-sm text-gray-500">
                              Échéance: {new Date(task.due_date).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        task.status === 'a_faire' ? 'bg-gray-200 text-gray-700' :
                        task.status === 'en_cours' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {task.status === 'a_faire' ? 'À faire' :
                         task.status === 'en_cours' ? 'En cours' : 'Terminé'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Aucune tâche en cours</p>
                  <Link 
                    href="/dashboard-wedding/tasks"
                    className="inline-block mt-3 text-pink-500 hover:text-pink-600 font-medium"
                  >
                    Créer une tâche
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link 
                href="/dashboard-wedding/budget"
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-pink-200 transition-all">
                  <DollarSign className="text-pink-600" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Budget</h3>
                <p className="text-sm text-gray-600">Gérer vos dépenses</p>
              </Link>

              <Link 
                href="/dashboard-wedding/tasks"
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-all">
                  <CheckCircle className="text-blue-600" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Tâches</h3>
                <p className="text-sm text-gray-600">Suivre l'avancement</p>
              </Link>

              <Link 
                href="/dashboard-wedding/inspirations"
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-all">
                  <Sparkles className="text-purple-600" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Inspirations</h3>
                <p className="text-sm text-gray-600">Mood board</p>
              </Link>

              <Link 
                href="/prestataire"
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-all">
                  <Users className="text-orange-600" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Prestataires</h3>
                <p className="text-sm text-gray-600">Trouver des pros</p>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
