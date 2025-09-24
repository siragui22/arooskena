'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPrestataires: 0,
    totalMariages: 0,
    totalCarouselItems: 0
  });
  const [users, setUsers] = useState([]);
  const [prestataires, setPrestataires] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      // 1. Vérifier l’utilisateur connecté via Supabase Auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
  
      if (userError) {
        console.error("❌ Erreur auth.getUser:", userError);
      }
  
      if (!user) {
        console.warn("⚠️ Aucun utilisateur connecté, redirection vers /sign-in");
        router.push('/sign-in');
        return;
      }
  
      // 2. Charger les infos de l’utilisateur depuis la table users + jointure avec roles
      const { data: userData, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          auth_user_id,
          role_id,
          roles:role_id(name, label)
        `)
        .eq('auth_user_id', user.id)
        .single();
  
      if (error) {
        console.error("❌ Erreur chargement userData:", error);
        router.push('/dashboard');
        return;
      }
  
      console.log("✅ Données utilisateur récupérées:", userData);
  
      // 3. Vérifier si l’utilisateur est admin
      if (!userData) {
        console.warn("⚠️ userData est vide → redirection vers /dashboard");
        router.push('/dashboard');
        return;
      }
  
      if (!userData.roles) {
        console.warn("⚠️ Aucun rôle trouvé pour cet utilisateur → redirection vers /dashboard");
        router.push('/dashboard');
        return;
      }
  
      if (userData.roles.name !== 'admin') {
        console.warn(`⚠️ Utilisateur avec rôle ${userData.roles.name}, pas admin → redirection`);
        router.push('/dashboard');
        return;
      }
  
      // 4. Si admin → autorisé
      console.log("✅ Utilisateur admin détecté → accès autorisé");
      setUser(user);
      await loadData();
      setLoading(false);
    };
  
    checkAdmin();
  }, [router]);
  

  const loadData = async () => {
    try {
      // Charger les statistiques
      const [usersCount, prestatairesCount, mariagesCount, carouselCount] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact' }),
        supabase.from('prestataires').select('*', { count: 'exact' }),
        supabase.from('mariages').select('*', { count: 'exact' }),
        supabase.from('carousel_items').select('*', { count: 'exact' })
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        totalPrestataires: prestatairesCount.count || 0,
        totalMariages: mariagesCount.count || 0,
        totalCarouselItems: carouselCount.count || 0
      });

      // Charger les utilisateurs récents
      const { data: recentUsers } = await supabase
        .from('users')
        .select(`
          *,
          roles(name, label),
          profiles(first_name, last_name, avatar)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setUsers(recentUsers || []);

      // Charger les prestataires récents avec les catégories
      const { data: recentPrestataires, error: prestatairesError } = await supabase
        .from('prestataires')
        .select(`
          *,
          categories(name, label),
          subcategories(name, label),
          subscription_types(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (prestatairesError) {
        console.error('❌ Erreur lors du chargement des prestataires:', prestatairesError);
      } else {
        console.log('✅ Prestataires chargés:', recentPrestataires?.length || 0, recentPrestataires);
      }

      setPrestataires(recentPrestataires || []);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const handleUserStatusChange = async (userId, isActive) => {
    try {
      await supabase
        .from('users')
        .update({ is_active: isActive })
        .eq('id', userId);

      // Recharger les données
      await loadData();
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

      // Recharger les données
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="loader-aroos"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="header-aroos animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
                👑 Dashboard Admin
              </h1>
              <p className="text-gray-600 text-lg">
                Gestion de la plateforme Arooskena
              </p>
            </div>
            <Link href="/dashboard" className="btn btn-outline">
              ← Retour au Dashboard
            </Link>
          </div>
        </div>

        {/* Onglets */}
        <div className="section-aroos mb-8">
          <div className="flex space-x-4 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
              { id: 'users', label: 'Utilisateurs', icon: '👥' },
              { id: 'prestataires', label: 'Prestataires', icon: '🏢' },
              { id: 'platform', label: 'Plateforme', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-aroosPink border-b-2 border-aroosPink'
                    : 'text-gray-600 hover:text-aroosPink'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="stat-aroos animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="icon-aroos">👥</div>
                <div className="text-2xl font-bold text-gray-800">{stats.totalUsers}</div>
                <div className="text-gray-600">Utilisateurs</div>
              </div>
              
              <div className="stat-aroos animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="icon-aroos">🏢</div>
                <div className="text-2xl font-bold text-gray-800">{stats.totalPrestataires}</div>
                <div className="text-gray-600">Prestataires</div>
              </div>
              
              <div className="stat-aroos animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="icon-aroos">💒</div>
                <div className="text-2xl font-bold text-gray-800">{stats.totalMariages}</div>
                <div className="text-gray-600">Mariages</div>
              </div>
              
              <div className="stat-aroos animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="icon-aroos">🖼️</div>
                <div className="text-2xl font-bold text-gray-800">{stats.totalCarouselItems}</div>
                <div className="text-gray-600">Carrousel</div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="section-aroos">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <span className="icon-aroos mr-2">⚡</span>
                  Actions rapides
                </h3>
                <div className="space-y-3">
                  <Link href="/admin/users" className="btn btn-outline w-full">
                    👥 Gérer les utilisateurs
                  </Link>
                  <Link href="/admin/roles" className="btn btn-outline w-full">
                    🎭 Gérer les rôles
                  </Link>
                  <button className="btn btn-outline w-full">
                    🏢 Vérifier les prestataires
                  </button>
                  <button className="btn btn-outline w-full">
                    🖼️ Gérer le carrousel
                  </button>
                  <button className="btn btn-outline w-full">
                    📊 Voir les rapports
                  </button>
                </div>
              </div>

              <div className="section-aroos">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <span className="icon-aroos mr-2">📈</span>
                  Activité récente
                </h3>
                <div className="space-y-3">
                  <div className="notification-aroos">
                    <p className="text-sm">5 nouveaux utilisateurs aujourd'hui</p>
                  </div>
                  <div className="notification-aroos">
                    <p className="text-sm">2 prestataires en attente de vérification</p>
                  </div>
                  <div className="notification-aroos">
                    <p className="text-sm">3 nouveaux mariages créés</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="section-aroos">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <span className="icon-aroos mr-2">👥</span>
              Gestion des utilisateurs
            </h3>
            
            <div className="overflow-x-auto">
              <table className="table-aroos w-full">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Statut</th>
                    <th>Date d'inscription</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                                             <td>
                         <div className="flex items-center">
                         <div className="avatar">
                           {user.profiles?.[0]?.avatar ? (
                             <div className="mask mask-squircle h-12 w-12">
                               <img 
                                 src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profil_avatars/${user.profiles[0].avatar}`}
                                 alt="Avatar"
                                 className="w-full h-full object-cover"
                               />
                             </div>
                           ) : (
                             <div className="mask mask-squircle h-12 w-12 bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg">
                               {user.profiles?.[0]?.first_name?.charAt(0) ||
                                 user.email?.charAt(0)}
                             </div>
                           )}
                         </div>
                           <div className="ml-3">
                             <div className="font-medium">
                               {user.profiles?.[0]?.first_name} {user.profiles?.[0]?.last_name}
                             </div>
                           </div>
                         </div>
                       </td>
                       <td>{user.email}</td>
                       <td>
                         <span className={`badge-aroos ${
                           user.roles?.name === 'admin' ? 'bg-red-500' :
                           user.roles?.name === 'prestataire' ? 'bg-blue-500' : 'bg-green-500'
                         }`}>
                           {user.roles?.label || user.roles?.name || 'N/A'}
                         </span>
                       </td>
                      <td>
                        <span className={`badge-aroos ${
                          user.is_active ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {user.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUserStatusChange(user.id, !user.is_active)}
                            className={`btn btn-xs ${
                              user.is_active ? 'btn-error' : 'btn-success'
                            }`}
                          >
                            {user.is_active ? 'Désactiver' : 'Activer'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          <div className="section-aroos">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <span className="icon-aroos mr-2">⚙️</span>
              Gestion de la plateforme
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/admin/users" className="card-hover p-6">
                <h4 className="text-lg font-semibold mb-2">👥 Gestion des Utilisateurs</h4>
                <p className="text-gray-600 mb-4">Gérez tous les utilisateurs de la plateforme</p>
                <button className="btn-aroos-outline">Accéder</button>
              </Link>
              
              <Link href="/admin/roles" className="card-hover p-6">
                <h4 className="text-lg font-semibold mb-2">⚙️ Gestion des Roles</h4>
                <p className="text-gray-600 mb-4">Paramètres, carrousel, contenu</p>
                <button className="btn-aroos-outline">Accéder</button>
              </Link>
              
              <Link href="/admin/categories" className="card-hover p-6">
                <h4 className="text-lg font-semibold mb-2">📂 Gestion des Catégories</h4>
                <p className="text-gray-600 mb-4">Catégories principales</p>
                <button className="btn-aroos-outline">Accéder</button>
              </Link>
              
              <Link href="/admin/subcategories" className="card-hover p-6">
                <h4 className="text-lg font-semibold mb-2">📁 Gestion des Sous-catégories</h4>
                <p className="text-gray-600 mb-4">Sous-catégories détaillées</p>
                <button className="btn-aroos-outline">Accéder</button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
