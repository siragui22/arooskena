'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Hash } from 'lucide-react';

export default function AdminPlatform() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [carouselItems, setCarouselItems] = useState([]);
  const [platformStats, setPlatformStats] = useState({
    totalMariages: 0,
    totalServices: 0,
    totalAvis: 0,
    totalAbonnements: 0,
    totalTags: 0,
    totalTagUsage: 0
  });
  const [activeTab, setActiveTab] = useState('carousel');
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
      // Charger les statistiques de la plateforme
      const [mariages, services, avis, abonnements, carousel, tags] = await Promise.all([
        supabase.from('mariages').select('id', { count: 'exact' }),
        supabase.from('services').select('id', { count: 'exact' }),
        supabase.from('avis').select('id', { count: 'exact' }),
        supabase.from('abonnements').select('id', { count: 'exact' }),
        supabase.from('carousel_items').select('*').order('ordre', { ascending: true }),
        supabase.from('tags').select('usage_count', { count: 'exact' })
      ]);

      const totalUsageCount = tags.data ? tags.data.reduce((sum, tag) => sum + tag.usage_count, 0) : 0;

      setPlatformStats({
        totalMariages: mariages.count || 0,
        totalServices: services.count || 0,
        totalAvis: avis.count || 0,
        totalAbonnements: abonnements.count || 0,
        totalTags: tags.count || 0,
        totalTagUsage: totalUsageCount
      });

      setCarouselItems(carousel.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const handleCarouselItemStatus = async (itemId, isActive) => {
    try {
      await supabase
        .from('carousel_items')
        .update({ is_active: isActive })
        .eq('id', itemId);

      await loadData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleCarouselItemOrder = async (itemId, newOrder) => {
    try {
      await supabase
        .from('carousel_items')
        .update({ ordre: newOrder })
        .eq('id', itemId);

      await loadData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
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
                ⚙️ Gestion de la Plateforme
              </h1>
              <p className="text-gray-600 text-lg">
                Configurez et gérez les paramètres d'Arooskena
              </p>
            </div>
            <Link href="/admin" className="btn-aroos-outline">
              ← Retour à l'Admin
            </Link>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat-aroos animate-fade-in-up">
            <div className="icon-aroos">💒</div>
            <div className="text-2xl font-bold text-gray-800">{platformStats.totalMariages}</div>
            <div className="text-gray-600">Mariages</div>
          </div>
          <div className="stat-aroos animate-fade-in-up">
            <div className="icon-aroos">🎯</div>
            <div className="text-2xl font-bold text-gray-800">{platformStats.totalServices}</div>
            <div className="text-gray-600">Services</div>
          </div>
          <div className="stat-aroos animate-fade-in-up">
            <div className="icon-aroos">⭐</div>
            <div className="text-2xl font-bold text-gray-800">{platformStats.totalAvis}</div>
            <div className="text-gray-600">Avis</div>
          </div>
          <div className="stat-aroos animate-fade-in-up">
            <div className="icon-aroos">💎</div>
            <div className="text-2xl font-bold text-gray-800">{platformStats.totalAbonnements}</div>
            <div className="text-gray-600">Abonnements</div>
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="section-aroos mb-8 animate-fade-in-up">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'carousel', label: 'Carrousel', icon: '🖼️' },
              { id: 'settings', label: 'Paramètres', icon: '⚙️' },
              { id: 'content', label: 'Contenu', icon: '📝' },
              { id: 'analytics', label: 'Analytics', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-pink-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'carousel' && (
          <div className="section-aroos animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Gestion du Carrousel</h2>
              <button className="btn-aroos">
                ➕ Ajouter un élément
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {carouselItems.map((item) => (
                <div key={item.id} className="card-hover p-6">
                  <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.titre}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.titre}</h3>
                  <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Ordre:</span>
                      <input
                        type="number"
                        value={item.ordre}
                        onChange={(e) => handleCarouselItemOrder(item.id, parseInt(e.target.value))}
                        className="input-aroos w-20 text-center"
                        min="1"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Statut:</span>
                      <button
                        onClick={() => handleCarouselItemStatus(item.id, !item.is_active)}
                        className={`badge-aroos ${
                          item.is_active ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      >
                        {item.is_active ? 'Actif' : 'Inactif'}
                      </button>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button className="btn-aroos-outline btn-sm flex-1">
                        ✏️ Modifier
                      </button>
                      <button className="btn btn-error btn-sm">
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {carouselItems.length === 0 && (
              <div className="empty-state text-center py-8">
                <div className="empty-state-icon">🖼️</div>
                <p className="text-gray-600 mb-4">Aucun élément de carrousel</p>
                <button className="btn-aroos">Ajouter le premier élément</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="section-aroos animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Paramètres de la Plateforme</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-aroos">
                <h3 className="text-lg font-semibold mb-4">Configuration Générale</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom de la plateforme
                    </label>
                    <input
                      type="text"
                      defaultValue="Arooskena"
                      className="input-aroos w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email de contact
                    </label>
                    <input
                      type="email"
                      defaultValue="contact@arooskena.com"
                      className="input-aroos w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone de contact
                    </label>
                    <input
                      type="tel"
                      defaultValue="+253 XX XX XX XX"
                      className="input-aroos w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="form-aroos">
                <h3 className="text-lg font-semibold mb-4">Paramètres de Modération</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modération automatique des avis
                    </label>
                    <select className="input-aroos w-full">
                      <option>Activée</option>
                      <option>Désactivée</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Validation manuelle des prestataires
                    </label>
                    <select className="input-aroos w-full">
                      <option>Obligatoire</option>
                      <option>Automatique</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button className="btn-aroos">
                💾 Sauvegarder les paramètres
              </button>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="section-aroos animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestion du Contenu</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/admin/tags" className="card-hover p-6 block">
                <div className="flex items-center gap-3 mb-3">
                  <Hash className="h-7 w-7 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold">Gérer les Tags</h3>
                    <p className="text-sm text-gray-500">
                      {platformStats.totalTags} tags · {platformStats.totalTagUsage} utilisations
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">Organisez le contenu avec des mots-clés.</p>
              </Link>

              <div className="card-hover p-6">
                <h3 className="text-lg font-semibold mb-4">📝 Blog</h3>
                <p className="text-gray-600 mb-4">Gérez les articles du blog</p>
                <button className="btn-aroos-outline">Gérer les articles</button>
              </div>
              
              <div className="card-hover p-6">
                <h3 className="text-lg font-semibold mb-4">📋 Pages Statiques</h3>
                <p className="text-gray-600 mb-4">À propos, conditions, etc.</p>
                <button className="btn-aroos-outline">Gérer les pages</button>
              </div>
              
              <div className="card-hover p-6">
                <h3 className="text-lg font-semibold mb-4">🎨 Thèmes</h3>
                <p className="text-gray-600 mb-4">Personnalisation visuelle</p>
                <button className="btn-aroos-outline">Gérer les thèmes</button>
              </div>
              
              <div className="card-hover p-6">
                <h3 className="text-lg font-semibold mb-4">📧 Emails</h3>
                <p className="text-gray-600 mb-4">Templates d'emails</p>
                <button className="btn-aroos-outline">Gérer les templates</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="section-aroos animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Analytics et Rapports</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card-hover p-6">
                <h3 className="text-lg font-semibold mb-4">📊 Statistiques</h3>
                <p className="text-gray-600 mb-4">Vue d'ensemble des performances</p>
                <button className="btn-aroos-outline">Voir les statistiques</button>
              </div>
              
              <div className="card-hover p-6">
                <h3 className="text-lg font-semibold mb-4">📈 Rapports</h3>
                <p className="text-gray-600 mb-4">Générer des rapports</p>
                <button className="btn-aroos-outline">Créer un rapport</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}












