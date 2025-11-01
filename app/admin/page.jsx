'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAdminStats, useAdminUsers, useAdminPrestataires } from '@/hooks/useAdmin';
import { useAuthStore } from '@/stores/useAuthStore';
import Link from 'next/link';
import { FileText, Users, Building2, Heart, Image as ImageIcon, BarChart3, Settings, Crown, CheckCircle, AlertCircle, TrendingUp, Calendar, Play } from 'lucide-react';

export default function AdminDashboard() {
  // ✅ User depuis le store global
  const storeUser = useAuthStore((state) => state.user);
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // ✅ Hooks React Query - NE s'exécutent QUE si admin vérifié
  const { data: stats = {
    totalUsers: 0,
    totalPrestataires: 0,
    totalMariages: 0,
    totalLieuxReception: 0,
    totalCarouselItems: 0,
    totalArticles: 0
  }, isLoading: statsLoading } = useAdminStats(isAdmin);
  const { data: users = [], isLoading: usersLoading } = useAdminUsers(isAdmin);
  const { data: prestataires = [], isLoading: prestatairesLoading } = useAdminPrestataires(isAdmin);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const router = useRouter();
  
  // Note: Les mutations ne sont pas utilisées ici car la page affiche juste les stats
  // Pour des mutations complètes, voir MIGRATIONS_DONE.md

  useEffect(() => {
    const checkAdmin = async () => {
      // ✅ Vérification sécurité admin (conservée)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
  
      if (userError || !user) {
        console.warn("⚠️ Aucun utilisateur connecté, redirection vers /sign-in");
        router.push('/sign-in');
        return;
      }
  
      // Vérifier le rôle depuis le store (déjà chargé par AuthSyncProvider)
      if (storeUser?.roles?.name !== 'admin') {
        console.warn(`⚠️ Utilisateur pas admin → redirection`);
        router.push('/dashboard');
        return;
      }
  
      console.log("✅ Utilisateur admin détecté → accès autorisé");
      setUser(user);
      setIsAdmin(true);
      setLoading(false);
    };
  
    checkAdmin();
  }, [router, storeUser]);
  

  // ✅ Plus besoin de loadData() - Les hooks React Query fetchent automatiquement!
  // Les données sont automatiquement mises en cache et partagées

  const handleUserStatusChange = async (userId, isActive) => {
    try {
      await supabase
        .from('users')
        .update({ is_active: isActive })
        .eq('id', userId);

      // ✅ Pas besoin de recharger - React Query invalidera automatiquement le cache
      // Si besoin, utiliser: queryClient.invalidateQueries(['admin', 'users'])
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handlePrestataireVerification = async (prestataireId, isVerified) => {
    try {
      await supabase
        .from('prestataires')
        .update({ is_verified: isVerified })
        .eq('id', prestataireId);

      // ✅ Pas besoin de recharger - React Query gère le cache
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
    }
  };

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.profiles?.[0]?.first_name} ${user.profiles?.[0]?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.roles?.name === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Actions bulk
  const handleBulkAction = async (action) => {
    try {
      const isActive = action === 'activate';
      
      await Promise.all(
        selectedUsers.map(userId =>
          supabase
            .from('users')
            .update({ is_active: isActive })
            .eq('id', userId)
        )
      );

      setSelectedUsers([]);
      // ✅ React Query invalidera le cache automatiquement
      alert(`${selectedUsers.length} utilisateur(s) ${isActive ? 'activé(s)' : 'désactivé(s)'} avec succès !`);
    } catch (error) {
      console.error('Erreur lors de l\'action bulk:', error);
      alert('Une erreur est survenue');
    }
  };

  // Export CSV
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const headers = ['Email', 'Prénom', 'Nom', 'Rôle', 'Statut', 'Date d\'inscription'];
    const csvContent = [
      headers.join(','),
      ...data.map(user => [
        user.email,
        user.profiles?.[0]?.first_name || '',
        user.profiles?.[0]?.last_name || '',
        user.roles?.label || user.roles?.name || '',
        user.is_active ? 'Actif' : 'Inactif',
        new Date(user.created_at).toLocaleDateString('fr-FR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle sélection utilisateur
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Sélectionner tous les utilisateurs
  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const isLoading = loading || statsLoading || usersLoading || prestatairesLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="loader-aroos"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header moderne */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-pink-400 to-orange-300 rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                  Dashboard Admin
                </h1>
              </div>
              <p className="text-sm sm:text-base text-gray-600 ml-0 sm:ml-14">
                Gestion de la plateforme Arooskena
              </p>
            </div>
            <Link href="/dashboard-wedding" className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-sm sm:text-base font-medium text-gray-700">
              ← Retour
            </Link>
          </div>
        </div>

        {/* Tabs modernes */}
        <div className="mb-6 sm:mb-8 overflow-x-auto">
          <div className="flex gap-2 min-w-max sm:min-w-0">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
              { id: 'users', label: 'Utilisateurs', icon: Users },
              { id: 'prestataires', label: 'Prestataires', icon: Building2 },
              { id: 'platform', label: 'Plateforme', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-pink-400 to-orange-300 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-pink-50 hover:text-pink-600 border border-gray-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm sm:text-base">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Statistiques modernes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.totalUsers}</div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Utilisateurs</div>
              </div>
              
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.totalPrestataires}</div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Prestataires</div>
              </div>
              
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-pink-400 to-orange-300 rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.totalMariages}</div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Mariages</div>
              </div>
              
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.totalLieuxReception}</div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Lieux de réception</div>
              </div>
            </div>

            {/* Graphiques de répartition */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100">
              <h3 className="text-base sm:text-lg font-bold mb-6 flex items-center text-gray-900">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-orange-300 rounded-lg flex items-center justify-center mr-2">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                Répartition des utilisateurs
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Mariés</span>
                    <span className="text-sm font-bold text-gray-900">{users.filter(u => u.roles?.name === 'marie').length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-pink-400 to-orange-300 rounded-full transition-all duration-500"
                      style={{ width: `${(users.filter(u => u.roles?.name === 'marie').length / stats.totalUsers) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Prestataires</span>
                    <span className="text-sm font-bold text-gray-900">{users.filter(u => u.roles?.name === 'prestataire').length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${(users.filter(u => u.roles?.name === 'prestataire').length / stats.totalUsers) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Admins</span>
                    <span className="text-sm font-bold text-gray-900">{users.filter(u => u.roles?.name === 'admin').length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all duration-500"
                      style={{ width: `${(users.filter(u => u.roles?.name === 'admin').length / stats.totalUsers) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions rapides et Activité */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100">
                <h3 className="text-base sm:text-lg font-bold mb-4 flex items-center text-gray-900">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-orange-300 rounded-lg flex items-center justify-center mr-2">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  Actions rapides
                </h3>
                <div className="space-y-2">
                  <Link href="/admin/users" className="flex items-center gap-3 w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 hover:bg-pink-50 border border-gray-200 hover:border-pink-300 rounded-lg transition-all group">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-pink-600" />
                    <span className="text-sm sm:text-base font-medium text-gray-700 group-hover:text-pink-600">Gérer les utilisateurs</span>
                  </Link>
                  <Link href="/admin/roles" className="flex items-center gap-3 w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 hover:bg-pink-50 border border-gray-200 hover:border-pink-300 rounded-lg transition-all group">
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-pink-600" />
                    <span className="text-sm sm:text-base font-medium text-gray-700 group-hover:text-pink-600">Gérer les rôles</span>
                  </Link>
                  <Link href="/admin/tags" className="flex items-center gap-3 w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 hover:bg-pink-50 border border-gray-200 hover:border-pink-300 rounded-lg transition-all group">
                    <span className="text-base sm:text-lg text-gray-600 group-hover:text-pink-600">#</span>
                    <span className="text-sm sm:text-base font-medium text-gray-700 group-hover:text-pink-600">Gérer les tags</span>
                  </Link>
                  <Link href="/admin/articles" className="flex items-center gap-3 w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 hover:bg-pink-50 border border-gray-200 hover:border-pink-300 rounded-lg transition-all group">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-pink-600" />
                    <span className="text-sm sm:text-base font-medium text-gray-700 group-hover:text-pink-600">Gérer les articles</span>
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100">
                <h3 className="text-base sm:text-lg font-bold mb-4 flex items-center text-gray-900">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg flex items-center justify-center mr-2">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  Statistiques de la plateforme
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-gray-900">Total utilisateurs</p>
                        <span className="text-lg font-bold text-blue-600">{stats.totalUsers}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Tous rôles confondus</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <Building2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-gray-900">Prestataires</p>
                        <span className="text-lg font-bold text-purple-600">{stats.totalPrestataires}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{prestataires.filter(p => p.is_verified).length} vérifiés</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-gray-900">Lieux de réception</p>
                        <span className="text-lg font-bold text-green-600">{stats.totalLieuxReception}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Référencés sur la plateforme</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-pink-50 border border-pink-200 rounded-lg">
                    <Heart className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-gray-900">Mariages planifiés</p>
                        <span className="text-lg font-bold text-pink-600">{stats.totalMariages}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Sur la plateforme</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            {/* Header avec recherche et filtres */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 mb-6">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 flex items-center text-gray-900">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <Users className="w-5 h-5 text-white" />
                </div>
                Gestion des utilisateurs
              </h3>
              
              {/* Barre de recherche et filtres */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                >
                  <option value="all">Tous les rôles</option>
                  <option value="admin">Admin</option>
                  <option value="marie">Marié</option>
                  <option value="prestataire">Prestataire</option>
                </select>
                <button
                  onClick={() => exportToCSV(users, 'utilisateurs')}
                  className="px-4 py-2.5 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
              </div>
              
              {/* Actions bulk */}
              {selectedUsers.length > 0 && (
                <div className="mt-4 p-3 bg-pink-50 border border-pink-200 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {selectedUsers.length} utilisateur(s) sélectionné(s)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkAction('activate')}
                      className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Activer
                    </button>
                    <button
                      onClick={() => handleBulkAction('deactivate')}
                      className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Désactiver
                    </button>
                    <button
                      onClick={() => setSelectedUsers([])}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-300 cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Utilisateur</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rôle</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-300 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                         <div className="flex items-center gap-3">
                           {user.profiles?.[0]?.avatar ? (
                             <img 
                               src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profil_avatars/${user.profiles[0].avatar}`}
                               alt="Avatar"
                               className="w-10 h-10 rounded-full object-cover"
                             />
                           ) : (
                             <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center font-bold rounded-full">
                               {user.profiles?.[0]?.first_name?.charAt(0) || user.email?.charAt(0)}
                             </div>
                           )}
                           <div>
                             <div className="font-medium text-gray-900 text-sm">
                               {user.profiles?.[0]?.first_name} {user.profiles?.[0]?.last_name}
                             </div>
                           </div>
                         </div>
                       </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">{user.email}</span>
                      </td>
                      <td className="px-4 py-3">
                         <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                           user.roles?.name === 'admin' ? 'bg-red-100 text-red-700' :
                           user.roles?.name === 'prestataire' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                         }`}>
                           {user.roles?.label || user.roles?.name || 'N/A'}
                         </span>
                       </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {user.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString('fr-FR')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleUserStatusChange(user.id, !user.is_active)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            user.is_active 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {user.is_active ? 'Désactiver' : 'Activer'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prestataires' && (
          <div className="space-y-6">
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                  <span className="text-3xl mr-3">🏢</span>
                  Gestion des prestataires
                </h3>
              </div>
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">Total</div>
                  <div className="stat-value text-primary">{stats.totalPrestataires}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Vérifiés</div>
                  <div className="stat-value text-success">
                    {prestataires.filter(p => p.is_verified).length}
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau responsive avec DaisyUI */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body p-0">
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Entreprise</th>
                        <th className="hidden md:table-cell">Catégorie</th>
                        <th className="hidden lg:table-cell">Sous-catégorie</th>
                        <th>Vérifié</th>
                        <th className="hidden xl:table-cell">Abonnement</th>
                        <th className="hidden 2xl:table-cell">Date d'inscription</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prestataires.map((prestataire) => (
                        <tr key={prestataire.id} className="hover">
                          <td>
                            <div className="flex items-center space-x-3">
                              <div className="avatar">
                                <div className="mask mask-squircle w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg">
                                  {prestataire.nom_entreprise?.charAt(0) || 'P'}
                                </div>
                              </div>
                              <div>
                                <div className="font-bold text-sm sm:text-base">
                                  {prestataire.nom_entreprise}
                                </div>
                                <div className="text-xs sm:text-sm opacity-70">
                                  {prestataire.email || 'N/A'}
                                </div>
                                <div className="text-xs opacity-50 md:hidden">
                                  {prestataire.categories?.label || prestataire.categories?.name || 'N/A'}
                                </div>
                                <div className="text-xs opacity-50 lg:hidden">
                                  {prestataire.subcategories?.label || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="hidden md:table-cell">
                            <div className="badge badge-outline">
                              {prestataire.categories?.label || prestataire.categories?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="hidden lg:table-cell">
                            <div className="badge badge-ghost">
                              {prestataire.subcategories?.label || 'N/A'}
                            </div>
                          </td>
                          <td>
                            {prestataire.is_verified ? (
                              <div className="badge badge-success gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Vérifié
                              </div>
                            ) : (
                              <div className="badge badge-warning gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                En attente
                              </div>
                            )}
                          </td>
                          <td className="hidden lg:table-cell">
                            <div className="badge badge-primary">
                              {prestataire.subscription_types?.name || 'Gratuit'}
                            </div>
                          </td>
                          <td className="hidden 2xl:table-cell">
                            <div className="text-sm">
                              {new Date(prestataire.created_at).toLocaleDateString('fr-FR')}
                            </div>
                            <div className="text-xs opacity-70">
                              {new Date(prestataire.created_at).toLocaleTimeString('fr-FR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </td>
                          <td>
                            <div className="flex flex-col sm:flex-row gap-1">
                              <button
                                onClick={() => handlePrestataireVerification(prestataire.id, !prestataire.is_verified)}
                                className={`btn btn-xs ${
                                  prestataire.is_verified 
                                    ? 'btn-warning' 
                                    : 'btn-success'
                                }`}
                                title={prestataire.is_verified ? 'Dévérifier' : 'Vérifier'}
                              >
                                {prestataire.is_verified ? (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <span className="hidden sm:inline">Dévérifier</span>
                                  </>
                                ) : (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="hidden sm:inline">Vérifier</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'platform' && (
          <div>
            <h3 className="text-xl sm:text-2xl font-bold mb-6 flex items-center text-gray-900">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-orange-300 rounded-lg flex items-center justify-center mr-3">
                <Settings className="w-5 h-5 text-white" />
              </div>
              Gestion de la plateforme
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Link href="/admin/users" className="group bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 hover:border-pink-300 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-blue-500 rounded-lg flex items-center justify-center transition-all">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 group-hover:text-white" />
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-gray-300 group-hover:text-pink-300 transition-colors">{stats.totalUsers}</span>
                </div>
                <h4 className="text-base sm:text-lg font-bold mb-2 text-gray-900">Gestion des Utilisateurs</h4>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">Gérez tous les utilisateurs de la plateforme</p>
                <div className="flex items-center text-sm font-medium text-pink-600 group-hover:text-pink-700">
                  Accéder 
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              
              <Link href="/admin/roles" className="group bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 hover:border-pink-300 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-purple-500 rounded-lg flex items-center justify-center transition-all">
                    <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 group-hover:text-white" />
                  </div>
                </div>
                <h4 className="text-base sm:text-lg font-bold mb-2 text-gray-900">Gestion des Rôles</h4>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">Gérez les rôles et permissions</p>
                <div className="flex items-center text-sm font-medium text-pink-600 group-hover:text-pink-700">
                  Accéder
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              
              <Link href="/admin/categories" className="group bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 hover:border-pink-300 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 group-hover:bg-gradient-to-r group-hover:from-green-400 group-hover:to-green-500 rounded-lg flex items-center justify-center transition-all">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                </div>
                <h4 className="text-base sm:text-lg font-bold mb-2 text-gray-900">Catégories</h4>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">Catégories principales</p>
                <div className="flex items-center text-sm font-medium text-pink-600 group-hover:text-pink-700">
                  Accéder
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              
              <Link href="/admin/subcategories" className="group bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 hover:border-pink-300 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 group-hover:bg-gradient-to-r group-hover:from-yellow-400 group-hover:to-yellow-500 rounded-lg flex items-center justify-center transition-all">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <h4 className="text-base sm:text-lg font-bold mb-2 text-gray-900">Sous-catégories</h4>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">Sous-catégories détaillées</p>
                <div className="flex items-center text-sm font-medium text-pink-600 group-hover:text-pink-700">
                  Accéder
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              
              <Link href="/admin/tags" className="group bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 hover:border-pink-300 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-100 group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-orange-300 rounded-lg flex items-center justify-center transition-all">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                </div>
                <h4 className="text-base sm:text-lg font-bold mb-2 text-gray-900">Tags</h4>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">Gestion des tags</p>
                <div className="flex items-center text-sm font-medium text-pink-600 group-hover:text-pink-700">
                  Accéder
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              
              <Link href="/admin/articles" className="group bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 hover:border-pink-300 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 group-hover:bg-gradient-to-r group-hover:from-orange-400 group-hover:to-orange-500 rounded-lg flex items-center justify-center transition-all">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 group-hover:text-white" />
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-gray-300 group-hover:text-pink-300 transition-colors">{stats.totalArticles}</span>
                </div>
                <h4 className="text-base sm:text-lg font-bold mb-2 text-gray-900">Articles</h4>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">{stats.totalArticles} articles publiés</p>
                <div className="flex items-center text-sm font-medium text-pink-600 group-hover:text-pink-700">
                  Accéder
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              <Link href="/admin/carrousel" className="group bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 hover:border-pink-300 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 group-hover:bg-gradient-to-r group-hover:from-red-400 group-hover:to-red-500 rounded-lg flex items-center justify-center transition-all">
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 group-hover:text-white" />
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-gray-300 group-hover:text-pink-300 transition-colors">{stats.totalCarouselItems}</span>
                </div>
                <h4 className="text-base sm:text-lg font-bold mb-2 text-gray-900">Carrousel</h4>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">Gérez les slides publicitaires</p>
                <div className="flex items-center text-sm font-medium text-pink-600 group-hover:text-pink-700">
                  Accéder
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
