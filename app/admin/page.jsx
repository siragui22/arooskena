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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/sign-in');
        return;
      }

              // Vérifier si l'utilisateur est admin
        const { data: userData } = await supabase
          .from('users')
          .select(`
            *,
            roles(name, label)
          `)
          .eq('auth_user_id', user.id)
          .single();

        if (!userData || userData.roles?.name !== 'admin') {
        router.push('/dashboard');
        return;
      }

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

      // Charger les prestataires récents
      const { data: recentPrestataires } = await supabase
        .from('prestataires')
        .select(`
          *,
          users(email, first_name, roles(name, label))
        `)
        .order('created_at', { ascending: false })
        .limit(10);

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
            <Link href="/dashboard" className="btn-aroos-outline">
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
                  <button className="btn-aroos-outline w-full">
                    👥 Gérer les utilisateurs
                  </button>
                  <button className="btn-aroos-outline w-full">
                    🏢 Vérifier les prestataires
                  </button>
                  <button className="btn-aroos-outline w-full">
                    🖼️ Gérer le carrousel
                  </button>
                  <button className="btn-aroos-outline w-full">
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
                           <div className="profile-avatar w-8 h-8 text-sm">
                             {user.profiles?.[0]?.first_name?.charAt(0) || user.email?.charAt(0)}
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
          <div className="section-aroos">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <span className="icon-aroos mr-2">🏢</span>
              Gestion des prestataires
            </h3>
            
            <div className="overflow-x-auto">
              <table className="table-aroos w-full">
                <thead>
                  <tr>
                    <th>Entreprise</th>
                    <th>Catégorie</th>
                    <th>Vérifié</th>
                    <th>Abonnement</th>
                    <th>Date d'inscription</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prestataires.map((prestataire) => (
                    <tr key={prestataire.id}>
                      <td>
                        <div className="font-medium">{prestataire.nom_entreprise}</div>
                        <div className="text-sm text-gray-600">{prestataire.users?.email}</div>
                      </td>
                      <td>
                        <span className="badge-aroos bg-blue-500">
                          {prestataire.categorie}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-aroos ${
                          prestataire.is_verified ? 'bg-green-500' : 'bg-yellow-500'
                        }`}>
                          {prestataire.is_verified ? 'Vérifié' : 'En attente'}
                        </span>
                      </td>
                      <td>
                        <span className="badge-aroos bg-purple-500">
                          {prestataire.subscription_type}
                        </span>
                      </td>
                      <td>{new Date(prestataire.created_at).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handlePrestataireVerification(prestataire.id, !prestataire.is_verified)}
                            className={`btn btn-xs ${
                              prestataire.is_verified ? 'btn-warning' : 'btn-success'
                            }`}
                          >
                            {prestataire.is_verified ? 'Dévérifier' : 'Vérifier'}
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
              
              <Link href="/admin/platform" className="card-hover p-6">
                <h4 className="text-lg font-semibold mb-2">⚙️ Configuration Plateforme</h4>
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
